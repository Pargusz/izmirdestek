import React, { useState } from 'react';
import { X, Image as ImageIcon, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './NewPostModal.css';

import { censorText } from '../utils/profanityFilter';

const NewPostModal = ({ isOpen, onClose, onSubmit }) => {
    const [content, setContent] = useState('');
    const [username, setUsername] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);

        // Censor text content and username
        const cleanContent = censorText(content);
        const cleanUsername = username ? censorText(username) : '';

        // Clean up media URL
        let cleanMediaUrl = mediaUrl.trim();

        // Fix: Detect and remove "example site" if it was auto-appended
        // The user reported "example site" being added to the beginning
        if (cleanMediaUrl.toLowerCase().includes('example site')) {
            cleanMediaUrl = cleanMediaUrl.replace(/example\s*site/gi, '').trim();
        }

        // Ensure protocol
        if (cleanMediaUrl && !cleanMediaUrl.match(/^https?:\/\//)) {
            cleanMediaUrl = `https://${cleanMediaUrl}`;
        }

        await onSubmit(cleanContent, cleanUsername, image, cleanMediaUrl || null);
        setLoading(false);

        // Reset and close
        setContent('');
        setUsername('');
        setMediaUrl('');
        setImage(null);
        onClose();
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay">
                    <motion.div
                        className="modal-content glass"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        <div className="modal-header">
                            <h2>Yeni Mesaj Paylaş</h2>
                            <button className="close-btn" onClick={onClose}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Kullanıcı Adı (Opsiyonel)"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            <div className="input-group">
                                <textarea
                                    placeholder="Ne anlatmak istersin?"
                                    rows="4"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <input
                                    type="url"
                                    placeholder="Video veya Link Ekle (https://...)"
                                    value={mediaUrl}
                                    onChange={(e) => setMediaUrl(e.target.value)}
                                    className="media-input"
                                />
                            </div>

                            <div className="form-actions">
                                <label className="image-upload-label">
                                    <ImageIcon size={20} />
                                    <span>{image ? (image.name.length > 20 ? image.name.substring(0, 20) + '...' : image.name) : 'Dosya/Görsel Ekle'}</span>
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,video/mp4"
                                        onChange={handleImageChange}
                                        hidden
                                    />
                                </label>

                                <button type="submit" className="submit-btn" disabled={loading || !content.trim()}>
                                    {loading ? 'Gönderiliyor...' : (
                                        <>
                                            <span>Paylaş</span>
                                            <Send size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default NewPostModal;
