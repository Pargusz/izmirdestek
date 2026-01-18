import React from 'react';
import { Search, Moon, Sun, Settings, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, onValue, runTransaction } from "firebase/database";
import { rtdb } from "../firebase";
import './Header.css';

const Header = ({ onSearch, theme, onToggleTheme }) => {
    const [showSettings, setShowSettings] = React.useState(false);
    const [viewCount, setViewCount] = React.useState(0);

    React.useEffect(() => {
        const viewRef = ref(rtdb, 'live_views');

        // Simple transaction to increment views on each mount
        try {
            runTransaction(viewRef, (currentValue) => {
                return (currentValue || 0) + 1;
            });
        } catch (error) {
            console.warn("RTDB Transaction failed (check rules):", error);
        }

        const unsubscribe = onValue(viewRef, (snapshot) => {
            setViewCount(snapshot.val() || 0);
        }, (error) => {
            console.warn("RTDB Subscription failed (check rules):", error);
        });

        return () => unsubscribe();
    }, []);

    return (
        <header className="header glass">
            <div className="header-content">
                <h1 className="logo">İzmir<span>Destek</span></h1>

                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Mesajlarda ara..."
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>

                <div className="header-actions">
                    <div className="live-badge glass">
                        <Eye size={14} />
                        <span>{viewCount}</span>
                    </div>

                    <button
                        className={`settings-toggle ${showSettings ? 'active' : ''}`}
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <Settings size={22} />
                    </button>

                    <AnimatePresence>
                        {showSettings && (
                            <motion.div
                                className="settings-menu glass"
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            >
                                <p className="menu-title">Görünüm</p>
                                <div className="menu-item" onClick={() => {
                                    onToggleTheme();
                                    setShowSettings(false);
                                }}>
                                    <div className="item-info">
                                        <span>Mod: {theme === 'dark' ? 'Gece Mavisi' : 'Aydınlık'}</span>
                                    </div>
                                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default Header;
