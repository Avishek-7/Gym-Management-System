import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-800 text-white py-8 mt-auto">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Gym Management</h3>
                        <p className="text-gray-300">
                            Your trusted partner for fitness and wellness management.
                        </p>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li><Link to="/about" className="text-gray-300 hover:text-white">About Us</Link></li>
                            <li><Link to="/services" className="text-gray-300 hover:text-white">Services</Link></li>
                            <li><Link to="/contact" className="text-gray-300 hover:text-white">Contact</Link></li>
                            <li><Link to="/membership" className="text-gray-300 hover:text-white">Membership</Link></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
                        <div className="text-gray-300 space-y-2">
                            <p>📍 123 Fitness Street, City</p>
                            <p>📞 (555) 123-4567</p>
                            <p>✉️ info@gymmanagement.com</p>
                        </div>
                    </div>
                </div>
                
                <div className="border-t border-gray-700 mt-8 pt-4 text-center">
                    <p className="text-gray-300">
                        © {new Date().getFullYear()} Gym Management System. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;