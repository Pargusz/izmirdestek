import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <p>© {new Date().getFullYear()} İzmir Destek - Tüm hakları saklıdır.</p>
                <p className="attribution">Bu site <span className="highlight">pargusz</span> tarafından yapılmıştır.</p>
            </div>
        </footer>
    );
};

export default Footer;
