import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, limit } from 'firebase/firestore';
import { db } from '../../services/core/firebase';

interface CollectionPermission {
  collection: string;
  canRead: boolean | null;
  canWrite: boolean | null;
  testing: boolean;
  error?: string;
}

export const PermissionsDiagnostics: React.FC = () => {
  const { user, userRole } = useAuth();
  const [permissions, setPermissions] = useState<CollectionPermission[]>([]);
  const [testing, setTesting] = useState(false);

  const collectionsToTest = [
    'packages',
    'members',
    'bills',
    'userRoles',
    'gymClasses',
    'classSessions',
    'classAttendance',
    'notifications',
  ];

  const testPermissions = async () => {
    setTesting(true);
    const results: CollectionPermission[] = [];

    for (const collectionName of collectionsToTest) {
      const result: CollectionPermission = {
        collection: collectionName,
        canRead: null,
        canWrite: null,
        testing: true,
      };

      // Test READ
      try {
        const q = query(collection(db, collectionName), limit(1));
        await getDocs(q);
        result.canRead = true;
      } catch (error) {
        result.canRead = false;
        const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: string }).code : undefined;
        if (code === 'permission-denied') {
          result.error = 'Permission denied';
        } else {
          result.error = String(error);
        }
      }

      // Test WRITE (create then immediately delete to avoid cluttering)
      try {
        const testDoc = await addDoc(collection(db, collectionName), {
          _test: true,
          _timestamp: new Date(),
        });
        // Clean up immediately
        await deleteDoc(doc(db, collectionName, testDoc.id));
        result.canWrite = true;
      } catch (error) {
        result.canWrite = false;
        const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: string }).code : undefined;
        if (!result.error && code === 'permission-denied') {
          result.error = 'Permission denied for write';
        }
      }

      result.testing = false;
      results.push(result);
      setPermissions([...results]); // Update UI progressively
    }

    setTesting(false);
  };

  const renderStatus = (value: boolean | null, testing: boolean) => {
    if (testing) {
      return <Loader className="w-4 h-4 animate-spin text-blue-400" />;
    }
    if (value === null) {
      return <span className="text-gray-500 text-sm">—</span>;
    }
    if (value) {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  return (
    <Card className="bg-gray-900/70 border-white/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          Permissions Diagnostics
        </CardTitle>
        <CardDescription>
          Check Firestore read/write permissions for your current user and role
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">User ID:</span>
            <span className="text-sm text-white font-mono">{user?.uid || 'Not authenticated'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Email:</span>
            <span className="text-sm text-white">{user?.email || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Role:</span>
            <span className={`text-sm font-medium px-2 py-1 rounded ${
              userRole === 'admin' 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                : userRole === 'trainer'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}>
              {userRole || 'No role assigned'}
            </span>
          </div>
        </div>

        {/* Test Button */}
        <Button
          onClick={testPermissions}
          disabled={testing || !user}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {testing ? 'Testing Permissions...' : 'Test Firestore Permissions'}
        </Button>

        {/* Results Table */}
        {permissions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">Collection</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-300">Read</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-300">Write</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {permissions.map((perm) => (
                  <tr key={perm.collection} className="hover:bg-gray-800/30">
                    <td className="px-4 py-2 text-sm text-white font-mono">{perm.collection}</td>
                    <td className="px-4 py-2 text-center">
                      {renderStatus(perm.canRead, perm.testing)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {renderStatus(perm.canWrite, perm.testing)}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-400">
                      {perm.error || (perm.canRead && perm.canWrite ? 'Full access' : perm.canRead ? 'Read-only' : '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Help Text */}
        {permissions.length > 0 && permissions.some(p => !p.canWrite) && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-300">
              <strong>Missing write permissions?</strong> Ensure:
            </p>
            <ul className="text-xs text-yellow-300/80 mt-2 space-y-1 list-disc list-inside">
              <li>Your <code className="bg-gray-800/50 px-1 rounded">userRoles/{'{'}uid{'}'}</code> document has role: "admin"</li>
              <li>Firestore rules allow admins to write (check firestore.rules)</li>
              <li>Rules are published in Firebase Console</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
