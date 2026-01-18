import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, User, Eye, Download, FileText, Video as VideoIcon, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { postService } from '../services/postService';
import './PostCard.css';

const PostCard = ({ post, onLike, onComment, currentUserId }) => {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const isLiked = post.likes?.includes(currentUserId);
    const cardRef = useRef(null);

    const handleSendComment = () => {
        if (commentText.trim()) {
            onComment(post.id, commentText);
            setCommentText('');
        }
    };

    // Initial View Count Logic
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const viewedKey = `viewed_post_${post.id}`;
                        const hasViewed = localStorage.getItem(viewedKey);

                        if (!hasViewed) {
                            postService.incrementView(post.id);
                            localStorage.setItem(viewedKey, 'true');
                        }
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.5 } // Trigger when 50% of the card is visible
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (cardRef.current) {
                observer.unobserve(cardRef.current);
            }
        };
    }, [post.id]);

    // Helper functions for media embeds
    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const getSpotifyEmbedUrl = (url) => {
        if (!url) return null;
        // Support track, album, playlist
        const match = url.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
        if (match) {
            return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
        }
        return null;
    };

    const getInstagramId = (url) => {
        if (!url) return null;
        // Detect instagram.com/p/{id} or /reel/{id}
        const match = url.match(/instagram\.com\/(p|reel)\/([a-zA-Z0-9_-]+)/);
        return match ? match[2] : null;
    };

    const getTwitterEmbedUrl = (url) => {
        if (!url) return null;
        // Detect twitter.com or x.com
        if (url.match(/(twitter|x)\.com\/\w+\/status\/\d+/)) {
            return `https://twitframe.com/show?url=${encodeURIComponent(url)}`;
        }
        return null;
    };

    const youtubeId = getYoutubeId(post.mediaUrl);
    const spotifyEmbedUrl = getSpotifyEmbedUrl(post.mediaUrl);
    const instagramId = getInstagramId(post.mediaUrl);
    const twitterEmbedUrl = getTwitterEmbedUrl(post.mediaUrl);

    const handleShare = () => {
        const shareUrl = `${window.location.origin}/post/${post.id}`;
        navigator.clipboard.writeText(shareUrl);
        alert('Bağlantı kopyalandı!');
    };

    return (
        <motion.div
            ref={cardRef}
            className="post-card glass animate-fade"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            layout
        >
            <div className="post-header">
                <div className="user-icon">
                    <User size={20} />
                </div>
                <div className="user-info">
                    <span className="username">{post.username}</span>
                    <span className="timestamp">
                        {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('tr-TR') : 'Şimdi'}
                    </span>
                </div>
                {/* Temporary Delete Button for Cleanup */}
                <button
                    style={{ marginLeft: 'auto', background: 'red', color: 'white', border: 'none', padding: '5px', borderRadius: '5px', cursor: 'pointer' }}
                    onClick={async () => {
                        if (confirm("Silmek istiyor musun?")) {
                            await postService.deletePost(post.id); // Assuming deletePost exists in service, if not I will add it.
                            window.location.reload();
                        }
                    }}
                    className="temp-delete-btn"
                >
                    Sil
                </button>
            </div>

            <div className="post-content">
                <p>{post.content}</p>

                {(post.fileUrl || post.imageUrl) && (
                    <div className="post-asset">
                        {post.fileType?.startsWith('video/') ? (
                            <div className="video-player-container">
                                <video controls width="100%" className="native-video">
                                    <source src={post.fileUrl || post.imageUrl} type={post.fileType} />
                                    Tarayıcınız video etiketini desteklemiyor.
                                </video>
                            </div>
                        ) : post.fileType?.startsWith('image/') || (!post.fileType && post.imageUrl) ? (
                            <div className="post-image">
                                <img src={post.fileUrl || post.imageUrl} alt="Post" />
                            </div>
                        ) : (
                            <div className="file-attachment glass">
                                <div className="file-icon">
                                    {post.fileType?.includes('pdf') ? <FileText size={32} color="#e74c3c" /> :
                                        post.fileType?.includes('sheet') || post.fileType?.includes('excel') ? <FileText size={32} color="#27ae60" /> :
                                            <FileText size={32} color="#3498db" />}
                                </div>
                                <div className="file-info">
                                    <span className="file-name">{post.fileName || 'Dosya Eki'}</span>
                                    <a
                                        href={post.fileUrl || post.imageUrl}
                                        download={post.fileType?.includes('pdf') || post.fileType?.includes('image') ? undefined : (post.fileName || 'download')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="download-btn"
                                    >
                                        <Download size={16} /> {post.fileType?.includes('pdf') || post.fileType?.includes('image') ? 'Dosyayı Görüntüle' : 'İndir'}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {post.mediaUrl && (
                    <div className="post-media">
                        {youtubeId ? (
                            <div className="video-container">
                                <iframe
                                    src={`https://www.youtube.com/embed/${youtubeId}`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        ) : spotifyEmbedUrl ? (
                            <div className="spotify-embed">
                                <iframe
                                    src={spotifyEmbedUrl}
                                    width="100%"
                                    height="80"
                                    frameBorder="0"
                                    allowtransparency="true"
                                    allow="encrypted-media"
                                ></iframe>
                            </div>
                        ) : instagramId ? (
                            <div className="instagram-embed">
                                <iframe
                                    src={`https://www.instagram.com/p/${instagramId}/embed`}
                                    width="100%"
                                    height="450"
                                    frameBorder="0"
                                    allowtransparency="true"
                                ></iframe>
                            </div>
                        ) : twitterEmbedUrl ? (
                            <div className="twitter-embed">
                                <iframe
                                    src={twitterEmbedUrl}
                                    width="100%"
                                    height="400"
                                    frameBorder="0"
                                    allowtransparency="true"
                                ></iframe>
                            </div>
                        ) : (
                            <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer" className="link-preview glass">
                                <span>🔗 Linke Git: {post.mediaUrl}</span>
                            </a>
                        )}
                    </div>
                )}
            </div>

            <div className="post-actions">
                <button
                    className={`action-btn like ${isLiked ? 'active' : ''}`}
                    onClick={() => onLike(post.id, isLiked)}
                >
                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                    <span>{post.likes?.length || 0}</span>
                </button>

                <button
                    className="action-btn comment"
                    onClick={() => setShowComments(!showComments)}
                >
                    <MessageCircle size={20} />
                    <span>{post.comments?.length || 0}</span>
                </button>

                <button className="action-btn share" onClick={handleShare}>
                    <Share2 size={20} />
                </button>

                <div className="view-count glass">
                    <Eye size={16} />
                    <span>{post.views || 0}</span>
                </div>
            </div>

            <AnimatePresence>
                {showComments && (
                    <motion.div
                        className="comments-section"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <div className="comments-list">
                            {post.comments?.map((comment, index) => (
                                <div key={index} className="comment-item">
                                    <span className="comment-user">{comment.username}</span>
                                    <p className="comment-text">{comment.content}</p>
                                </div>
                            ))}
                        </div>
                        <div className="add-comment glass">
                            <input
                                type="text"
                                placeholder="Yorum yap..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && commentText.trim()) {
                                        handleSendComment();
                                    }
                                }}
                            />
                            <button
                                className="send-comment-btn"
                                onClick={handleSendComment}
                                disabled={!commentText.trim()}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default PostCard;
