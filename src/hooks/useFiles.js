import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export function useFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFiles = useCallback(async (includeTrash = false) => {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!includeTrash) {
        query = query.is('deleted_at', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFile = async (file) => {
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('files')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
          url: publicUrl,
          is_link: false
        })
        .select()
        .single();

      if (error) throw error;
      setFiles(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const addLink = async (linkTarget, filename) => {
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('files')
        .insert({
          user_id: user.id,
          filename: filename || linkTarget,
          file_type: 'link',
          file_size: 0,
          storage_path: null,
          url: linkTarget,
          is_link: true
        })
        .select()
        .single();

      if (error) throw error;
      setFiles(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteFile = async (id, storagePath) => {
    setError('');
    try {
      const { error } = await supabase
        .from('files')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const restoreFile = async (id) => {
    setError('');
    try {
      const { error } = await supabase
        .from('files')
        .update({ deleted_at: null })
        .eq('id', id);
      if (error) throw error;
      // Refetch to get restored file
      await fetchFiles(true);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const permanentDelete = async (id, storagePath) => {
    setError('');
    try {
      if (storagePath) {
        await supabase.storage.from('files').remove([storagePath]);
      }
      const { error } = await supabase.from('files').delete().eq('id', id);
      if (error) throw error;
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const createShare = async (fileId) => {
    setError('');
    try {
      const shareToken = uuidv4();
      const { data, error } = await supabase
        .from('shares')
        .insert({
          file_id: fileId,
          share_token: shareToken,
          created_by: (await supabase.auth.getUser()).data.user.id
        })
        .select()
        .single();

      if (error) throw error;
      return `${window.location.origin}/shared/${shareToken}`;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const shareWithUser = async (fileId, targetEmail) => {
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const normalizedEmail = targetEmail.toLowerCase().trim();

      // Find target user by email (case-insensitive)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', normalizedEmail)
        .single();

      if (profileError || !profiles) {
        // Debug: check if profiles table exists and has data
        const { data: allProfiles } = await supabase.from('profiles').select('email').limit(5);
        console.log('Available profiles:', allProfiles);
        throw new Error('User not found with that email. Make sure they have signed up at least once.');
      }

      const targetUserId = profiles.id;
      if (targetUserId === user.id) {
        throw new Error('Cannot share with yourself');
      }

      // Check if already shared
      const { data: existing } = await supabase
        .from('file_shares')
        .select('id')
        .eq('file_id', fileId)
        .eq('shared_with_user_id', targetUserId)
        .single();

      if (existing) {
        throw new Error('Already shared with this user');
      }

      // Create share
      const { data, error } = await supabase
        .from('file_shares')
        .insert({
          file_id: fileId,
          shared_with_user_id: targetUserId,
          shared_by_user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const revokeShare = async (fileId, targetUserId) => {
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('file_shares')
        .delete()
        .eq('file_id', fileId)
        .eq('shared_with_user_id', targetUserId)
        .eq('shared_by_user_id', user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const fetchSharedWithMe = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get files shared with current user - two queries to avoid FK relationship requirement
      const { data: shares, error: sharesError } = await supabase
        .from('file_shares')
        .select('file_id, shared_by_user_id, created_at')
        .eq('shared_with_user_id', user.id);

      if (sharesError) throw sharesError;

      if (!shares || shares.length === 0) {
        setFiles([]);
        return;
      }

      // Get emails of users who shared
      const sharedByIds = [...new Set(shares.map(s => s.shared_by_user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', sharedByIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map(p => [p.id, p.email]));

      const fileIds = shares.map(s => s.file_id);
      const { data: files, error: filesError } = await supabase
        .from('files')
        .select('*')
        .in('id', fileIds)
        .is('deleted_at', null);

      if (filesError) throw filesError;

      // Merge share info with file data
      const filesWithShareInfo = (files || []).map(file => {
        const share = shares.find(s => s.file_id === file.id);
        return {
          ...file,
          shared_by_email: share ? profileMap.get(share.shared_by_user_id) : null,
          shared_at: share?.created_at
        };
      });

      setFiles(filesWithShareInfo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { files, loading, error, fetchFiles, uploadFile, addLink, deleteFile, restoreFile, permanentDelete, createShare, shareWithUser, revokeShare, fetchSharedWithMe };
}