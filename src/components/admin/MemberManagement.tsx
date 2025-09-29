import type { ChangeEvent, FC } from 'react';
import { useMemo, useState } from 'react';
import type { Member } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MemberManagementProps {
  members: Member[];
  onAddMember: (member: Member) => void;
  onUpdateMember: (updatedMember: Member) => void;
  onDeleteMember: (memberId: string) => void;
}

type MemberFormState = Pick<
  Member,
  'name' | 'age' | 'membershipType' | 'joinDate'
>;

const defaultJoinDate = (): string => new Date().toISOString().split('T')[0];

const createEmptyFormState = (): MemberFormState => ({
  name: '',
  age: 0,
  membershipType: 'Basic',
  joinDate: defaultJoinDate(),
});

const MemberManagement: FC<MemberManagementProps> = ({
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
}) => {
  const [formState, setFormState] = useState<MemberFormState>(
    createEmptyFormState,
  );
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const membershipOptions = useMemo<Member['membershipType'][]>(
    () => ['Basic', 'Premium', 'VIP'],
    [],
  );

  const resetForm = () => {
    setFormState(createEmptyFormState);
    setEditingMember(null);
  };

  const handleChange = (field: keyof MemberFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: field === 'age' ? Number(value) || 0 : value,
    }));
  };

  const handleInputChange =
    (field: keyof MemberFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      handleChange(field, event.currentTarget.value);
    };

  const handleSubmit = () => {
    const trimmedName = formState.name.trim();
    const isValidAge = Number.isFinite(formState.age) && formState.age > 0;

    if (!trimmedName || !isValidAge) {
      return;
    }

    if (editingMember) {
      onUpdateMember({
        ...editingMember,
        ...formState,
        name: trimmedName,
      });
    } else {
      const generatedId =
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      onAddMember({
        id: generatedId,
        ...formState,
        name: trimmedName,
      } as Member);
    }

    resetForm();
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormState({
      name: member.name,
      age: member.age,
      membershipType: member.membershipType,
      joinDate: member.joinDate,
    });
  };

  const isEditing = Boolean(editingMember);
  const isSubmitDisabled =
    !formState.name.trim() ||
    !Number.isFinite(formState.age) ||
    formState.age <= 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Update Member' : 'Add Member'}</CardTitle>
          <CardDescription>
            {isEditing
              ? 'Modify the selected member’s details and save your changes.'
              : 'Register a new member by providing their basic information.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="member-name"
            >
              Name
            </label>
            <Input
              id="member-name"
              placeholder="John Doe"
              value={formState.name}
              onChange={handleInputChange('name')}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="member-age"
            >
              Age
            </label>
            <Input
              id="member-age"
              type="number"
              min={1}
              placeholder="29"
              value={formState.age ? String(formState.age) : ''}
              onChange={handleInputChange('age')}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Membership Type
            </label>
            <Select
              value={formState.membershipType}
              onValueChange={(value) => handleChange('membershipType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select membership" />
              </SelectTrigger>
              <SelectContent>
                {membershipOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-muted-foreground"
              htmlFor="member-join-date"
            >
              Join Date
            </label>
            <Input
              id="member-join-date"
              type="date"
              value={formState.joinDate}
              onChange={handleInputChange('joinDate')}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {isEditing ? 'Save Changes' : 'Add Member'}
          </Button>

          {isEditing && (
            <Button variant="outline" onClick={resetForm}>
              Cancel Editing
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            View, edit, and manage all registered members.
          </CardDescription>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-24">Age</TableHead>
                <TableHead>Membership Type</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {members.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No members found. Add your first member above.
                  </TableCell>
                </TableRow>
              )}

              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.name}
                  </TableCell>
                  <TableCell>{member.age}</TableCell>
                  <TableCell>{member.membershipType}</TableCell>
                  <TableCell>{member.joinDate}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(member)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteMember(member.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberManagement;