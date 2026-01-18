import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    getDoc,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    increment,
    deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";

const POSTS_COLLECTION = "posts";

// Helper function to convert file to Base64
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

// Helper to get or create a unique Device ID (Digital Fingerprint)
const getDeviceId = () => {
    let deviceId = localStorage.getItem("device_uuid");
    if (!deviceId) {
        // Simple random UUID generation
        deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        localStorage.setItem("device_uuid", deviceId);
    }
    return deviceId;
};

export const postService = {
    // Create a new post (Storing image as Base64 in Firestore) and log IP securely
    createPost: async (content, username, file, mediaUrl = null) => {
        let fileUrl = null;
        let fileType = null;
        let fileName = null;
        let logData = {
            ip: "UNKNOWN_IP",
            city: "Unknown",
            region: "Unknown",
            country: "Unknown",
            isp: "Unknown"
        };

        // 1. Get the user's IP & Geolocation
        try {
            // trying ipapi.co for detailed location
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            logData = {
                ip: data.ip || "UNKNOWN_IP",
                city: data.city || "Unknown",
                region: data.region || "Unknown",
                country: data.country_name || "Unknown",
                isp: data.org || "Unknown"
            };
        } catch (error) {
            console.error("GeoIP Fetch Error, falling back to basic IP:", error);
            // Fallback to basic IP if detailed service fails
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                logData.ip = ipData.ip;
            } catch (fallbackError) {
                console.error("Fallback IP Fetch Error:", fallbackError);
            }
        }

        if (file) {
            try {
                // Warning: Firestore document size limit is 1MB. 
                // Large images/files will fail. We use Base64 as requested to avoid Storage.
                // increased limit slightly but strict 1mb limit exists
                if (file.size > 950000) {
                    throw new Error("Dosya çok büyük! Lütfen 1MB'dan küçük bir dosya seçin.");
                }
                fileUrl = await fileToBase64(file);
                fileType = file.type;
                fileName = file.name;
            } catch (error) {
                console.error("Base64 Conversion Error:", error);
                throw error;
            }
        }

        try {
            // 2. Create the Public Post (No IP here for security)
            const postRef = await addDoc(collection(db, POSTS_COLLECTION), {
                content,
                username: username || "Anonim",
                imageUrl: fileUrl, // Keeping legacy name for now to avoid breaking existing posts
                fileUrl, // New field for clarity
                fileType,
                fileName,
                mediaUrl, // YouTube link, video link, or general URL
                likes: [],
                comments: [],
                views: 0,
                createdAt: serverTimestamp()
            });

            // 3. Create a Private Log (Stores IP, Device ID, and Evidence)
            // Stored in 'post_logs' collection which should be secured via Rules
            try {
                const deviceId = getDeviceId();
                const browserInfo = {
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    platform: navigator.platform,
                    screenResolution: `${window.screen.width}x${window.screen.height}`,
                    referrer: document.referrer || "Direct"
                };

                await addDoc(collection(db, "post_logs"), {
                    postId: postRef.id,
                    ipAddress: logData.ip,
                    location: {
                        city: logData.city,
                        region: logData.region,
                        country: logData.country,
                        isp: logData.isp
                    },
                    deviceId: deviceId, // Digital Fingerprint
                    timestamp: serverTimestamp(),
                    username: username || "Anonim",
                    fullContent: content || "", // Storing FULL content for legal evidence
                    browserInfo: browserInfo, // Extended metadata
                    contentSnippet: content ? content.substring(0, 100) : "Media only" // Kept for quick preview
                });
            } catch (logError) {
                console.error("Logging Error:", logError);
                // We don't stop the flow if logging fails, but we log the error to console
            }

            return postRef;
        } catch (error) {
            console.error("Firestore Error:", error);
            throw error;
        }
    },

    // Increment View Count
    incrementView: async (postId) => {
        try {
            const postRef = doc(db, POSTS_COLLECTION, postId);
            await updateDoc(postRef, {
                views: increment(1)
            });
        } catch (error) {
            console.error("Increment View Error:", error);
            // Don't throw here, viewing shouldn't block UI if it fails
        }
    },

    // Get a single post by ID
    getPost: async (postId) => {
        try {
            const postRef = doc(db, POSTS_COLLECTION, postId);
            const postSnap = await getDoc(postRef);
            if (postSnap.exists()) {
                return { id: postSnap.id, ...postSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Get Post Error:", error);
            throw error;
        }
    },

    // Get all posts (real-time)
    subscribeToPosts: (callback) => {
        const q = query(collection(db, POSTS_COLLECTION), orderBy("createdAt", "desc"));
        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(posts);
        }, (error) => {
            console.error("Firestore Subscription Error:", error);
        });
    },

    // Like / Unlike a post
    toggleLike: async (postId, userId, isLiked) => {
        try {
            const postRef = doc(db, POSTS_COLLECTION, postId);
            await updateDoc(postRef, {
                likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
            });
        } catch (error) {
            console.error("Like Error:", error);
            throw error;
        }
    },

    // Add a comment
    addComment: async (postId, content, username) => {
        try {
            const postRef = doc(db, POSTS_COLLECTION, postId);
            const newComment = {
                content,
                username: username || "Anonim",
                createdAt: new Date().toISOString()
            };
            await updateDoc(postRef, {
                comments: arrayUnion(newComment)
            });
        } catch (error) {
            console.error("Comment Error:", error);
            throw error;
        }
    },

    // Delete a post
    deletePost: async (postId) => {
        try {
            await deleteDoc(doc(db, POSTS_COLLECTION, postId));
        } catch (error) {
            console.error("Delete Post Error:", error);
            throw error;
        }
    }
};
