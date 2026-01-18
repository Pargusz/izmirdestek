import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import PostCard from './components/PostCard';
import PostView from './components/PostView';
import NewPostModal from './components/NewPostModal';
import { postService } from './services/postService';
import './App.css';

const SESSION_USER_ID = localStorage.getItem('izmir_destek_uid') ||
  (() => {
    const id = Math.random().toString(36).substring(2, 11);
    localStorage.setItem('izmir_destek_uid', id);
    return id;
  })();

function App() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('izmir_destek_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('izmir_destek_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const unsubscribe = postService.subscribeToPosts((data) => {
      setPosts(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(post =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPosts(filtered);
    }
  }, [searchQuery, posts]);

  const handleCreatePost = async (content, username, image, mediaUrl) => {
    try {
      await postService.createPost(content, username, image, mediaUrl);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Gönderi oluşturulurken bir hata oluştu.");
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      await postService.toggleLike(postId, SESSION_USER_ID, isLiked);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleComment = async (postId, content) => {
    try {
      await postService.addComment(postId, content, "Anonim");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <div className="app-container">
      <Header onSearch={setSearchQuery} theme={theme} onToggleTheme={toggleTheme} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <>
              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onComment={handleComment}
                    currentUserId={SESSION_USER_ID}
                  />
                ))
              ) : (
                <div className="empty-state glass">
                  <p>Henüz mesaj yok veya aramanızla eşleşen sonuç bulunamadı.</p>
                </div>
              )}

              <button className="fab-btn" onClick={() => setIsModalOpen(true)}>
                <Plus size={32} />
              </button>
            </>
          } />

          <Route path="/post/:postId" element={<PostView />} />
        </Routes>
      </main>

      <NewPostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
      />

      <Footer />
    </div>
  );
}

export default App;
