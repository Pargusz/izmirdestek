import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { postService } from '../services/postService';
import PostCard from './PostCard';
import './PostView.css';

// Re-using SESSION_USER_ID logic
const SESSION_USER_ID = localStorage.getItem('izmir_destek_uid');

const PostView = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                // Removed direct incrementView call here.
                // It is now handled by PostCard's IntersectionObserver for unique unique tracking.

                const data = await postService.getPost(postId);
                setPost(data);
            } catch (error) {
                console.error("Error fetching post:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [postId]);

    const handleLike = async (id, isLiked) => {
        try {
            await postService.toggleLike(id, SESSION_USER_ID, isLiked);
            // Re-fetch or update local state for the single post
            const updated = await postService.getPost(id);
            setPost(updated);
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    const handleComment = async (id, content) => {
        try {
            await postService.addComment(id, content, "Anonim");
            // Re-fetch or update local state
            const updated = await postService.getPost(id);
            setPost(updated);
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    if (loading) {
        return (
            <div className="post-view-loading">
                <Loader2 className="animate-spin" size={40} />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="post-view-error glass">
                <h2>Mesaj bulunamadı.</h2>
                <button className="back-btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={18} /> Ana Sayfaya Dön
                </button>
            </div>
        );
    }

    return (
        <div className="post-view-container animate-fade">
            <button className="back-btn-top" onClick={() => navigate('/')}>
                <ArrowLeft size={18} /> Geri Dön
            </button>

            {post && (
                <Helmet>
                    <title>{`${post.username} kullanıcısının gönderisi | İzmir Destek`}</title>
                    <meta name="description" content={post.content.slice(0, 150) + (post.content.length > 150 ? '...' : '')} />

                    {/* Open Graph / Facebook */}
                    <meta property="og:title" content={`${post.username} kullanıcısının gönderisi`} />
                    <meta property="og:description" content={post.content.slice(0, 150) + (post.content.length > 150 ? '...' : '')} />
                    {post.imageUrl && <meta property="og:image" content={post.imageUrl} />}
                    {post.fileUrl && (post.fileType?.startsWith('image/') || !post.fileType) && <meta property="og:image" content={post.fileUrl} />}

                    {/* Twitter */}
                    <meta property="twitter:title" content={`${post.username} kullanıcısının gönderisi`} />
                    <meta property="twitter:description" content={post.content.slice(0, 150) + (post.content.length > 150 ? '...' : '')} />
                    {post.imageUrl && <meta property="twitter:image" content={post.imageUrl} />}
                    {post.fileUrl && (post.fileType?.startsWith('image/') || !post.fileType) && <meta property="twitter:image" content={post.fileUrl} />}
                </Helmet>
            )}

            <PostCard
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                currentUserId={SESSION_USER_ID}
            />
        </div>
    );
};

export default PostView;
