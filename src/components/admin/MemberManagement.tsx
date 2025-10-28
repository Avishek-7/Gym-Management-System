import type { ChangeEvent, FC, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/form-input';
import { addMember, getMembers, updateMember, deleteMember } from '../../services/member/memberService';
import type { Member } from '../../types/member';
import { getAllUsers, checkUserHasMemberProfile, type FirebaseUser } from '../../services/user/userService';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface MemberFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  membershipId: string;
  joinDate: string;
  status: Member['status'];
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  medicalConditions: string;
  profileImage: string;
}

const createEmptyFormState = (): MemberFormState => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  membershipId: '',
  joinDate: new Date().toISOString().split('T')[0],
  status: 'active',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
  medicalConditions: '',
  profileImage: '',
});

const MemberManagement: FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [formState, setFormState] = useState<MemberFormState>(createEmptyFormState());
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // User selection state
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<FirebaseUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<FirebaseUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const statusOptions = useMemo(() => ['active', 'inactive', 'suspended'] as const, []);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const fetchedMembers = await getMembers();
      setMembers(fetchedMembers);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const users = await getAllUsers();
      
      // Filter out users who already have member profiles
      const usersWithoutProfiles = await Promise.all(
        users.map(async (user) => {
          const hasMemberProfile = await checkUserHasMemberProfile(user.id);
          return hasMemberProfile ? null : user;
        })
      );
      
      const availableUsersList = usersWithoutProfiles.filter((user): user is FirebaseUser => user !== null);
      setAvailableUsers(availableUsersList);
      setFilteredUsers(availableUsersList);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenUserSelector = () => {
    setShowUserSelector(true);
    loadAvailableUsers();
  };

  const handleCloseUserSelector = () => {
    setShowUserSelector(false);
    setSearchQuery('');
    setSelectedUserId(null);
  };

  const handleSearchUsers = (query: string) => {
    setSearchQuery(query);
    const filtered = availableUsers.filter(
      (user) =>
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.id.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleProceedWithSelectedUser = () => {
    if (selectedUserId) {
      const selectedUser = availableUsers.find(u => u.id === selectedUserId);
      if (selectedUser) {
        setFormState(prev => ({
          ...prev,
          email: selectedUser.email,
        }));
      }
      setShowUserSelector(false);
      setShowAddForm(true);
    }
  };

  const handleAddMemberWithoutUser = () => {
    setSelectedUserId(null);
    setShowAddForm(true);
  };

  const handleFieldErrorClear = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const resetForm = () => {
    setFormState(createEmptyFormState());
    setEditingMember(null);
    setErrors({});
    setSelectedUserId(null);
    setShowAddForm(false);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
    handleFieldErrorClear(name);
  };

  const handleSelectChange = (field: keyof MemberFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
    handleFieldErrorClear(field);
  };

  const validateForm = (): boolean => {
    const validationErrors: Record<string, string> = {};

    if (!formState.firstName.trim()) {
      validationErrors.firstName = 'First name is required.';
    }
    if (!formState.lastName.trim()) {
      validationErrors.lastName = 'Last name is required.';
    }
    if (!formState.email.trim()) {
      validationErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      validationErrors.email = 'Please enter a valid email address.';
    }
    if (!formState.phone.trim()) {
      validationErrors.phone = 'Phone number is required.';
    }
    if (!formState.dateOfBirth) {
      validationErrors.dateOfBirth = 'Date of birth is required.';
    }
    if (!formState.membershipId.trim()) {
      validationErrors.membershipId = 'Membership ID is required.';
    }
    if (!formState.joinDate) {
      validationErrors.joinDate = 'Join date is required.';
    }
    if (!formState.emergencyContactName.trim()) {
      validationErrors.emergencyContactName = 'Emergency contact name is required.';
    }
    if (!formState.emergencyContactPhone.trim()) {
      validationErrors.emergencyContactPhone = 'Emergency contact phone is required.';
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const now = new Date();
      
      const memberData: Omit<Member, 'id'> = {
        userId: selectedUserId || undefined, // Link to Firebase Auth user if selected
        firstName: formState.firstName.trim(),
        lastName: formState.lastName.trim(),
        email: formState.email.trim(),
        phone: formState.phone.trim(),
        dateOfBirth: new Date(formState.dateOfBirth),
        address: {
          street: formState.street.trim(),
          city: formState.city.trim(),
          state: formState.state.trim(),
          zipCode: formState.zipCode.trim(),
          country: formState.country.trim(),
        },
        membershipId: formState.membershipId.trim(),
        joinDate: new Date(formState.joinDate),
        status: formState.status,
        emergencyContact: {
          name: formState.emergencyContactName.trim(),
          phone: formState.emergencyContactPhone.trim(),
          relationship: formState.emergencyContactRelationship.trim(),
        },
        medicalConditions: formState.medicalConditions.trim() ? formState.medicalConditions.split(',').map(c => c.trim()) : undefined,
        profileImage: formState.profileImage.trim() || undefined,
        createdAt: editingMember?.createdAt ?? now,
        updatedAt: now,
      };

      if (editingMember) {
        await updateMember(editingMember.id, memberData);
      } else {
        await addMember(memberData);
      }

      await loadMembers();
      resetForm();
    } catch (error) {
      console.error('Failed to save member:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormState({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      dateOfBirth: member.dateOfBirth instanceof Date ? member.dateOfBirth.toISOString().split('T')[0] : new Date(member.dateOfBirth).toISOString().split('T')[0],
      street: member.address.street,
      city: member.address.city,
      state: member.address.state,
      zipCode: member.address.zipCode,
      country: member.address.country,
      membershipId: member.membershipId,
      joinDate: member.joinDate instanceof Date ? member.joinDate.toISOString().split('T')[0] : new Date(member.joinDate).toISOString().split('T')[0],
      status: member.status,
      emergencyContactName: member.emergencyContact.name,
      emergencyContactPhone: member.emergencyContact.phone,
      emergencyContactRelationship: member.emergencyContact.relationship,
      medicalConditions: member.medicalConditions?.join(', ') || '',
      profileImage: member.profileImage || '',
    });
    setErrors({});
  };

  const handleDelete = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    const memberName = member ? `${member.firstName} ${member.lastName}` : 'this member';
    
    const shouldDelete = window.confirm(`Delete ${memberName}? This action cannot be undone.`);
    if (shouldDelete) {
      try {
        await deleteMember(memberId);
        await loadMembers();
      } catch (error) {
        console.error('Failed to delete member:', error);
      }
    }
  };

  const isEditing = Boolean(editingMember);
  const isSubmitDisabled = submitting || !formState.firstName.trim() || !formState.lastName.trim() || !formState.email.trim() || !formState.phone.trim();

  return (
    <div className="space-y-6">
      {/* User Selector Dialog */}
      <Dialog open={showUserSelector} onOpenChange={setShowUserSelector}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select a User</DialogTitle>
            <DialogDescription>
              Choose an existing Firebase user to create a member profile for, or skip to add a member without a user account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Search Input */}
            <div>
              <Input
                placeholder="Search by email or user ID..."
                value={searchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Loading State */}
            {loadingUsers && (
              <div className="flex justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading users...</div>
              </div>
            )}

            {/* Users List */}
            {!loadingUsers && filteredUsers.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedUserId === user.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {user.id} • Role: {user.role}
                        </p>
                      </div>
                      {selectedUserId === user.id && (
                        <div className="text-primary">✓</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loadingUsers && filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? 'No users found matching your search.'
                  : 'All users already have member profiles.'}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleProceedWithSelectedUser}
                disabled={!selectedUserId}
                className="flex-1"
              >
                Continue with Selected User
              </Button>
              <Button
                variant="outline"
                onClick={handleAddMemberWithoutUser}
                className="flex-1"
              >
                Add Member Without User
              </Button>
              <Button
                variant="ghost"
                onClick={handleCloseUserSelector}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Button (shown when form is not visible) */}
      {!showAddForm && !editingMember && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Member</CardTitle>
            <CardDescription>
              Create a member profile from an existing user account or add a new member manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleOpenUserSelector}>
              Select User to Create Member
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Member Form (shown when adding/editing) */}
      {(showAddForm || editingMember) && (
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Update Member' : 'Add Member'}</CardTitle>
            <CardDescription>
              {isEditing && 'Modify the selected member\'s details and save your changes.'}
              {!isEditing && selectedUserId && `Creating member profile for user: ${formState.email}`}
              {!isEditing && !selectedUserId && 'Register a new member by providing their basic information.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {selectedUserId && !isEditing && (
              <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm font-medium">Linked User Account</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This member profile will be linked to user: <span className="font-mono">{selectedUserId}</span>
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium" htmlFor="firstName">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formState.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    aria-describedby={errors.firstName ? "firstName-error" : undefined}
                  />
                  {errors.firstName && (
                    <p id="firstName-error" className="mt-1 text-sm text-destructive">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium" htmlFor="lastName">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formState.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    aria-describedby={errors.lastName ? "lastName-error" : undefined}
                  />
                  {errors.lastName && (
                    <p id="lastName-error" className="mt-1 text-sm text-destructive">
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium" htmlFor="email">
                    Email {selectedUserId && <span className="text-muted-foreground text-xs">(from user account)</span>}
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formState.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@example.com"
                    disabled={Boolean(selectedUserId)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-1 text-sm text-destructive">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium" htmlFor="phone">
                    Phone
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formState.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                  />
                  {errors.phone && (
                    <p id="phone-error" className="mt-1 text-sm text-destructive">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium" htmlFor="dateOfBirth">
                    Date of Birth
                  </label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formState.dateOfBirth}
                    onChange={handleInputChange}
                    aria-describedby={errors.dateOfBirth ? "dateOfBirth-error" : undefined}
                  />
                  {errors.dateOfBirth && (
                    <p id="dateOfBirth-error" className="mt-1 text-sm text-destructive">
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium" htmlFor="profileImage">
                    Profile Image URL (optional)
                  </label>
                  <Input
                    id="profileImage"
                    name="profileImage"
                    type="url"
                    value={formState.profileImage}
                    onChange={handleInputChange}
                    placeholder="https://example.com/profile.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium" htmlFor="street">
                    Street Address
                  </label>
                  <Input
                    id="street"
                    name="street"
                    value={formState.street}
                    onChange={handleInputChange}
                    placeholder="123 Main St"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium" htmlFor="city">
                    City
                  </label>
                  <Input
                    id="city"
                    name="city"
                    value={formState.city}
                    onChange={handleInputChange}
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium" htmlFor="state">
                    State/Province
                  </label>
                  <Input
                    id="state"
                    name="state"
                    value={formState.state}
                    onChange={handleInputChange}
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium" htmlFor="zipCode">
                    ZIP/Postal Code
                  </label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={formState.zipCode}
                    onChange={handleInputChange}
                    placeholder="10001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium" htmlFor="country">
                    Country
                  </label>
                  <Input
                    id="country"
                    name="country"
                    value={formState.country}
                    onChange={handleInputChange}
                    placeholder="United States"
                  />
                </div>
              </div>
            </div>

            {/* Membership Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Membership Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium" htmlFor="membershipId">
                    Membership ID
                  </label>
                  <Input
                    id="membershipId"
                    name="membershipId"
                    value={formState.membershipId}
                    onChange={handleInputChange}
                    placeholder="MEM-001"
                    aria-describedby={errors.membershipId ? "membershipId-error" : undefined}
                  />
                  {errors.membershipId && (
                    <p id="membershipId-error" className="mt-1 text-sm text-destructive">
                      {errors.membershipId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium" htmlFor="joinDate">
                    Join Date
                  </label>
                  <Input
                    id="joinDate"
                    name="joinDate"
                    type="date"
                    value={formState.joinDate}
                    onChange={handleInputChange}
                    aria-describedby={errors.joinDate ? "joinDate-error" : undefined}
                  />
                  {errors.joinDate && (
                    <p id="joinDate-error" className="mt-1 text-sm text-destructive">
                      {errors.joinDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium">Status</label>
                  <Select
                    value={formState.status}
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Emergency Contact</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium" htmlFor="emergencyContactName">
                    Contact Name
                  </label>
                  <Input
                    id="emergencyContactName"
                    name="emergencyContactName"
                    value={formState.emergencyContactName}
                    onChange={handleInputChange}
                    placeholder="Jane Doe"
                    aria-describedby={errors.emergencyContactName ? "emergencyContactName-error" : undefined}
                  />
                  {errors.emergencyContactName && (
                    <p id="emergencyContactName-error" className="mt-1 text-sm text-destructive">
                      {errors.emergencyContactName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium" htmlFor="emergencyContactPhone">
                    Contact Phone
                  </label>
                  <Input
                    id="emergencyContactPhone"
                    name="emergencyContactPhone"
                    type="tel"
                    value={formState.emergencyContactPhone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 987-6543"
                    aria-describedby={errors.emergencyContactPhone ? "emergencyContactPhone-error" : undefined}
                  />
                  {errors.emergencyContactPhone && (
                    <p id="emergencyContactPhone-error" className="mt-1 text-sm text-destructive">
                      {errors.emergencyContactPhone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium" htmlFor="emergencyContactRelationship">
                    Relationship
                  </label>
                  <Input
                    id="emergencyContactRelationship"
                    name="emergencyContactRelationship"
                    value={formState.emergencyContactRelationship}
                    onChange={handleInputChange}
                    placeholder="Spouse, Parent, etc."
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Medical Information (Optional)</h3>
              <div>
                <label className="block text-sm font-medium" htmlFor="medicalConditions">
                  Medical Conditions
                </label>
                <Input
                  id="medicalConditions"
                  name="medicalConditions"
                  value={formState.medicalConditions}
                  onChange={handleInputChange}
                  placeholder="Separate multiple conditions with commas"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter any relevant medical conditions, allergies, or health considerations.
                </p>
              </div>
            </div>

            <CardFooter className="flex flex-col gap-2 px-0 sm:flex-row sm:justify-between">
              <Button type="submit" disabled={isSubmitDisabled}>
                {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Member'}
              </Button>

              {(isEditing || showAddForm) && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  {isEditing ? 'Cancel Editing' : 'Cancel'}
                </Button>
              )}
            </CardFooter>
          </form>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            View, edit, and manage all registered members.
          </CardDescription>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading members...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Membership ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {members.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      No members found. Add your first member above.
                    </TableCell>
                  </TableRow>
                )}

                {members.map((member) => {
                  const joinDate = member.joinDate instanceof Date 
                    ? member.joinDate 
                    : new Date(member.joinDate);
                  
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.firstName} {member.lastName}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>{member.membershipId}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          member.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : member.status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{joinDate.toLocaleDateString()}</TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(member)}
                          aria-label={`Edit ${member.firstName} ${member.lastName}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
                          aria-label={`Delete ${member.firstName} ${member.lastName}`}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberManagement;