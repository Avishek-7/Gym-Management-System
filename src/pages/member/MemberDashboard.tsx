import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import Layout from '../../components/common/Layout';
import Dashboard from '../../components/member/Dashboard';
import NotificationCenter from '../../components/member/NotificationCenter';
import NotificationBell from '../../components/member/NotificationBell';
import { BillHistory } from '../../components/member/BillHistory';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Background from '../../components/common/Background';
import LogoutButton from '../../components/common/LogoutButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { db } from '../../services/core/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Member } from '../../types/member';
import type { Bill } from '../../types/billing';
import { Calendar, User as UserIcon, CreditCard, HelpCircle, Clock, Check } from 'lucide-react';

interface GymClass {
  id: string;
  name: string;
  instructor: string;
  time: string;
  duration: string;
  capacity: number;
  enrolled: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}


const MemberDashboard: React.FC = () => {
  const { user } = useAuth();

  // Modal states
  const [bookClassOpen, setBookClassOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Profile data
  const [memberData, setMemberData] = useState<Member | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  // Payment data
  const [pendingBills, setPendingBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Support form
  const [supportForm, setSupportForm] = useState({
    subject: '',
    category: 'general',
    message: ''
  });

  // Class booking
  const [availableClasses] = useState<GymClass[]>([
    { id: '1', name: 'Yoga Flow', instructor: 'Sarah Johnson', time: 'Mon, Wed, Fri - 7:00 AM', duration: '60 min', capacity: 20, enrolled: 15, difficulty: 'Beginner' },
    { id: '2', name: 'HIIT Training', instructor: 'Mike Rodriguez', time: 'Tue, Thu - 6:00 PM', duration: '45 min', capacity: 15, enrolled: 12, difficulty: 'Advanced' },
    { id: '3', name: 'Spin Class', instructor: 'Emma Davis', time: 'Mon, Wed, Fri - 6:30 PM', duration: '45 min', capacity: 25, enrolled: 20, difficulty: 'Intermediate' },
    { id: '4', name: 'Pilates', instructor: 'Lisa Chen', time: 'Tue, Thu - 9:00 AM', duration: '60 min', capacity: 15, enrolled: 10, difficulty: 'Beginner' },
    { id: '5', name: 'Boxing', instructor: 'James Wilson', time: 'Wed, Sat - 7:00 PM', duration: '60 min', capacity: 12, enrolled: 8, difficulty: 'Intermediate' },
  ]);

  // Fetch member profile
  useEffect(() => {
    const fetchMemberProfile = async () => {
      if (!user) return;
      
      setProfileLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as Member;
          setMemberData(data);
          setProfileForm({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            emergencyContact: data.emergencyContact || { name: '', phone: '', relationship: '' }
          });
        } else {
          // If no user document exists, use auth data
          setProfileForm({
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            email: user.email || '',
            phone: '',
            emergencyContact: { name: '', phone: '', relationship: '' }
          });
        }
      } catch (error) {
        console.error('Error fetching member profile:', error);
        // Fallback to auth data
        setProfileForm({
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          email: user.email || '',
          phone: '',
          emergencyContact: { name: '', phone: '', relationship: '' }
        });
      } finally {
        setProfileLoading(false);
      }
    };

    fetchMemberProfile();
  }, [user]);

  // Fetch pending bills for payments
  useEffect(() => {
    const fetchPendingBills = async () => {
      if (!user) return;
      
      try {
        const billsQuery = query(
          collection(db, 'bills'),
          where('userId', '==', user.uid),
          where('status', 'in', ['pending', 'overdue'])
        );
        const snapshot = await getDocs(billsQuery);
        const bills = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Bill[];
        
        // Sort by due date
        bills.sort((a, b) => {
          const dateA = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
          const dateB = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate);
          return dateA.getTime() - dateB.getTime();
        });
        
        setPendingBills(bills);
      } catch (error) {
        console.error('Error fetching pending bills:', error);
      }
    };

    if (paymentsOpen) {
      fetchPendingBills();
    }
  }, [paymentsOpen, user]);

  // Handle book class
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBookClass = (_classId: string) => {
    alert(`Successfully booked class! You will receive a confirmation email.`);
    setBookClassOpen(false);
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        emergencyContact: profileForm.emergencyContact,
        updatedAt: new Date()
      });
      
      alert('Profile updated successfully!');
      setEditMode(false);
      
      // Refresh member data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setMemberData(userDoc.data() as Member);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  // Handle payment
  const handlePayment = async (billId: string) => {
    setPaymentProcessing(true);
    setSelectedBill(billId);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update bill status
      await updateDoc(doc(db, 'bills', billId), {
        status: 'paid',
        paidDate: new Date(),
        updatedAt: new Date()
      });
      
      alert('Payment successful! Receipt has been sent to your email.');
      
      // Refresh pending bills
      setPendingBills(prev => prev.filter(bill => bill.id !== billId));
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
      setSelectedBill(null);
    }
  };

  // Handle support request
  const handleSupportSubmit = async () => {
    if (!supportForm.subject || !supportForm.message) {
      alert('Please fill in all required fields.');
      return;
    }
    
    try {
      // In a real app, this would submit to a support ticket system
      console.log('Support request submitted:', supportForm);
      
      alert('Support request submitted! Our team will get back to you within 24 hours.');
      setSupportForm({ subject: '', category: 'general', message: '' });
      setSupportOpen(false);
    } catch (error) {
      console.error('Error submitting support request:', error);
      alert('Failed to submit request. Please try again.');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-400 bg-green-400/10';
      case 'Intermediate': return 'text-yellow-400 bg-yellow-400/10';
      case 'Advanced': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-400 bg-green-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'overdue': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  if (!user) {
    return (
      <Layout title="Member Dashboard">
        <div className="flex items-center justify-center py-20">
          <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md p-8">
            <CardContent>
              <p className="text-gray-200">Please log in to view your dashboard</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <Background 
          hueShift={180}
          speed={0.3}
          warpAmount={0.5}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Layout
          title="Member Dashboard"
          subtitle={`Welcome back, ${user.displayName || 'Member'}!`}
          headerActions={
            <div className="flex items-center gap-3">
              <NotificationBell userId={user.uid} onClick={() => setNotificationsOpen(true)} />
              <LogoutButton />
            </div>
          }
        >
          {/* Welcome Banner */}
          <Card className="bg-gray-900/70 bg-gradient-to-r from-blue-500/20 to-purple-500/10 border-blue-500/30 mb-6 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl text-white">
            Welcome to your Gym Portal
          </CardTitle>
          <p className="text-gray-300 mt-2">
            Manage your membership, view billing history, and stay updated with your fitness journey.
          </p>
        </CardHeader>
      </Card>

      {/* Dashboard Component */}
      <Dashboard 
        userId={user.uid} 
        showQuickActions={true}
        showStats={true}
        limit={3}
        onBookClass={() => setBookClassOpen(true)}
        onViewProfile={() => setProfileOpen(true)}
        onMakePayment={() => setPaymentsOpen(true)}
        onGetSupport={() => setSupportOpen(true)}
        onViewNotifications={() => setNotificationsOpen(true)}
      />
      {/* Notifications Modal */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-md border border-white/20 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Bell className="w-6 h-6 text-blue-400" />
              Notifications
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              View and manage your notifications
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {/* NotificationCenter component */}
            {user?.uid && (
              <NotificationCenter userId={user.uid} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Bill History Section */}
      <div className="mt-8">
        <BillHistory 
          memberId={user.uid} 
          autoLoad={true}
        />
      </div>

          {/* Additional sections can be added here */}
          {/* Example: Upcoming classes, workout history, etc. */}
        </Layout>
      </div>

      {/* Book Class Modal */}
      <Dialog open={bookClassOpen} onOpenChange={setBookClassOpen}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-md border border-white/20 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Calendar className="w-6 h-6 text-blue-400" />
              Book a Class
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Browse available classes and book your spot
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {availableClasses.map((gymClass) => (
              <div key={gymClass.id} className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:border-blue-400/50 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{gymClass.name}</h3>
                    <p className="text-sm text-gray-400">with {gymClass.instructor}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(gymClass.difficulty)}`}>
                    {gymClass.difficulty}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Clock className="w-4 h-4 text-blue-400" />
                    {gymClass.time}
                  </div>
                  <div className="text-sm text-gray-300">
                    Duration: {gymClass.duration}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    <span className="text-white font-medium">{gymClass.enrolled}/{gymClass.capacity}</span> enrolled
                  </div>
                  <Button 
                    onClick={() => handleBookClass(gymClass.id)}
                    disabled={gymClass.enrolled >= gymClass.capacity}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {gymClass.enrolled >= gymClass.capacity ? 'Class Full' : 'Book Now'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-md border border-white/20 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <UserIcon className="w-6 h-6 text-blue-400" />
              My Profile
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              View and edit your personal information
            </DialogDescription>
          </DialogHeader>

          {profileLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    disabled={!editMode}
                    className="w-full bg-gray-800/50 border border-white/10 rounded-md px-3 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    disabled={!editMode}
                    className="w-full bg-gray-800/50 border border-white/10 rounded-md px-3 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="w-full bg-gray-800/50 border border-white/10 rounded-md px-3 py-2 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  disabled={!editMode}
                  className="w-full bg-gray-800/50 border border-white/10 rounded-md px-3 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold text-white mb-4">Emergency Contact</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      value={profileForm.emergencyContact.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({
                        ...profileForm,
                        emergencyContact: { ...profileForm.emergencyContact, name: e.target.value }
                      })}
                      disabled={!editMode}
                      className="w-full bg-gray-800/50 border border-white/10 rounded-md px-3 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={profileForm.emergencyContact.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({
                        ...profileForm,
                        emergencyContact: { ...profileForm.emergencyContact, phone: e.target.value }
                      })}
                      disabled={!editMode}
                      className="w-full bg-gray-800/50 border border-white/10 rounded-md px-3 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Relationship</label>
                    <input
                      type="text"
                      value={profileForm.emergencyContact.relationship}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileForm({
                        ...profileForm,
                        emergencyContact: { ...profileForm.emergencyContact, relationship: e.target.value }
                      })}
                      disabled={!editMode}
                      className="w-full bg-gray-800/50 border border-white/10 rounded-md px-3 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                {editMode ? (
                  <>
                    <Button
                      onClick={() => {
                        setEditMode(false);
                        // Reset form to current memberData or fallback to current values
                        if (memberData) {
                          setProfileForm({
                            firstName: memberData.firstName || '',
                            lastName: memberData.lastName || '',
                            email: memberData.email || '',
                            phone: memberData.phone || '',
                            emergencyContact: memberData.emergencyContact || { name: '', phone: '', relationship: '' }
                          });
                        }
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateProfile}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setEditMode(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payments Modal */}
      <Dialog open={paymentsOpen} onOpenChange={setPaymentsOpen}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-md border border-white/20 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <CreditCard className="w-6 h-6 text-blue-400" />
              Make a Payment
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              View and pay your pending bills
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {pendingBills.length === 0 ? (
              <div className="text-center py-12">
                <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No pending bills</p>
                <p className="text-gray-500 text-sm mt-2">You're all caught up!</p>
              </div>
            ) : (
              pendingBills.map((bill) => (
                <div key={bill.id} className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Bill #{bill.billNumber}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Due: {bill.dueDate instanceof Date 
                          ? bill.dueDate.toLocaleDateString() 
                          : new Date(bill.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                      {bill.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {bill.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-300">{item.description}</span>
                        <span className="text-white">${item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/10 pt-3 mb-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-white">Total Amount</span>
                      <span className="text-white">${bill.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handlePayment(bill.id)}
                    disabled={paymentProcessing && selectedBill === bill.id}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                  >
                    {paymentProcessing && selectedBill === bill.id ? 'Processing...' : 'Pay Now'}
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Support Modal */}
      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-md border border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <HelpCircle className="w-6 h-6 text-blue-400" />
              Support & Help
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Need assistance? Send us a message and we'll get back to you soon.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subject *</label>
              <input
                type="text"
                value={supportForm.subject}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupportForm({ ...supportForm, subject: e.target.value })}
                placeholder="Brief description of your issue"
                className="w-full bg-gray-800/50 border border-white/10 rounded-md px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={supportForm.category}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSupportForm({ ...supportForm, category: e.target.value })}
                className="w-full bg-gray-800/50 border border-white/10 rounded-md px-3 py-2 text-white"
              >
                <option value="general">General Inquiry</option>
                <option value="billing">Billing Question</option>
                <option value="technical">Technical Issue</option>
                <option value="membership">Membership</option>
                <option value="classes">Classes & Training</option>
                <option value="facilities">Facilities</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Message *</label>
              <textarea
                value={supportForm.message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSupportForm({ ...supportForm, message: e.target.value })}
                placeholder="Describe your issue or question in detail..."
                rows={6}
                className="w-full bg-gray-800/50 border border-white/10 rounded-md px-3 py-2 text-white resize-none"
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">Quick Tips</h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• We typically respond within 24 hours</li>
                <li>• For urgent issues, call us at (555) 123-4567</li>
                <li>• Check our FAQ section for common questions</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button
                onClick={() => {
                  setSupportForm({ subject: '', category: 'general', message: '' });
                  setSupportOpen(false);
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSupportSubmit}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberDashboard;