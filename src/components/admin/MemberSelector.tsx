import React, { useState, useEffect } from 'react';
import { getMembers } from '../../services/member/memberService';
import type { Member } from '../../types/member';

interface MemberSelectorProps {
  onSelect: (userId: string, membershipId: string, memberName: string) => void;
  selectedMembershipId?: string;
}

export const MemberSelector: React.FC<MemberSelectorProps> = ({ onSelect, selectedMembershipId }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getMembers();
        setMembers(data);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const filteredMembers = members.filter(member => 
    member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.membershipId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMemberSelect = (member: Member) => {
    const userId = member.userId || member.id; // Fallback to Firestore doc ID if no userId
    onSelect(userId, member.membershipId, `${member.firstName} ${member.lastName}`);
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <p className="text-sm text-gray-400">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Search by name, email, or membership ID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
      />

      <div className="max-h-64 overflow-y-auto space-y-2">
        {filteredMembers.length === 0 ? (
          <p className="text-sm text-gray-400 p-4 text-center">No members found</p>
        ) : (
          filteredMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => handleMemberSelect(member)}
              className={`w-full p-3 rounded-lg border transition-all text-left ${
                selectedMembershipId === member.membershipId
                  ? 'bg-purple-500/20 border-purple-500/50'
                  : 'bg-gray-800/30 border-gray-700 hover:border-purple-500/30 hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-sm text-gray-400">{member.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-purple-400 font-mono">{member.membershipId}</p>
                  <p className="text-xs text-gray-500">
                    {member.userId ? 'Has Account' : 'No Account'}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
