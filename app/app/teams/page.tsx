'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/db/supabase';
import styles from './TeamsPage.module.css';

type Tab = 'members' | 'approvals' | 'invite';

type Role = 'owner' | 'admin' | 'approver' | 'viewer';

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
}

interface PendingApproval {
  id: string;
  type: 'rule' | 'payroll';
  requestedBy: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function TeamsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('viewer');
  const [loading, setLoading] = useState(false);

  const accountType = (session?.user as any)?.accountType || 'personal';

  // Redirect if not business account
  if (accountType !== 'business') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Feature</h1>
          <p className="text-gray-600">
            This feature is only available for business accounts.
          </p>
        </div>
      </div>
    );
  }

  const handleInvite = async () => {
    if (!inviteEmail) return;

    setLoading(true);
    try {
      // Send invite via email or wallet
      alert(`Invitation sent to ${inviteEmail} as ${inviteRole}`);
      setInviteEmail('');
    } catch (error) {
      console.error('Failed to send invite:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id: string) => {
    setPendingApprovals(
      pendingApprovals.map((approval) =>
        approval.id === id ? { ...approval, status: 'approved' } : approval
      )
    );
  };

  const handleReject = (id: string) => {
    setPendingApprovals(
      pendingApprovals.map((approval) =>
        approval.id === id ? { ...approval, status: 'rejected' } : approval
      )
    );
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((member) => member.id !== id));
  };

  const handleChangeRole = (id: string, newRole: Role) => {
    setMembers(
      members.map((member) =>
        member.id === id ? { ...member, role: newRole } : member
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Management</h1>
          <p className="text-gray-600">
            Manage team members, roles, and approval workflows.
          </p>
        </div>

        {/* Organization Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Organization Wallet</h2>
              <p className="text-gray-600 mt-1">
                Shared treasury for team operations
              </p>
            </div>
            <div className={styles.walletDisplay}>
              <span className={styles.walletLabel}>Balance:</span>
              <span className={styles.walletValue}>••••••••</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'members' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'approvals' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('approvals')}
          >
            Pending Approvals
            {pendingApprovals.filter((a) => a.status === 'pending').length > 0 && (
              <span className={styles.badge}>
                {pendingApprovals.filter((a) => a.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'invite' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('invite')}
          >
            Invite
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'members' && (
          <div className={styles.tabContent}>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {members.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>No team members yet</p>
                  <button
                    onClick={() => setActiveTab('invite')}
                    className={styles.primaryBtn}
                  >
                    Invite First Member
                  </button>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td className={styles.nameCell}>{member.name}</td>
                        <td className={styles.emailCell}>{member.email}</td>
                        <td>
                          <select
                            value={member.role}
                            onChange={(e) => handleChangeRole(member.id, e.target.value as Role)}
                            className={styles.roleSelect}
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="approver">Approver</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </td>
                        <td className={styles.dateCell}>
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className={styles.removeBtn}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Role Permissions */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>
              <div className={styles.permissionsGrid}>
                <div className={styles.permissionCard}>
                  <h4 className={styles.permissionTitle}>Owner</h4>
                  <p className={styles.permissionDesc}>
                    Everything — create rules, payroll, manage members, delete org
                  </p>
                </div>
                <div className={styles.permissionCard}>
                  <h4 className={styles.permissionTitle}>Admin</h4>
                  <p className={styles.permissionDesc}>
                    Create rules, run payroll, add/remove members (not delete org)
                  </p>
                </div>
                <div className={styles.permissionCard}>
                  <h4 className={styles.permissionTitle}>Approver</h4>
                  <p className={styles.permissionDesc}>
                    Approve pending rules and payroll runs only
                  </p>
                </div>
                <div className={styles.permissionCard}>
                  <h4 className={styles.permissionTitle}>Viewer</h4>
                  <p className={styles.permissionDesc}>
                    Read-only — compliance reports and history only
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className={styles.tabContent}>
            <div className="bg-white rounded-lg shadow p-6">
              {pendingApprovals.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((approval) => (
                    <div
                      key={approval.id}
                      className={`${styles.approvalCard} ${approval.status !== 'pending' ? styles.approvalCardResolved : ''}`}
                    >
                      <div className={styles.approvalHeader}>
                        <div>
                          <span className={`${styles.approvalType} ${styles.badge}`}>
                            {approval.type}
                          </span>
                          <span className={styles.approvalRequestedBy}>
                            Requested by {approval.requestedBy}
                          </span>
                        </div>
                        <span className={`${styles.approvalStatus} ${styles.badge}`}>
                          {approval.status}
                        </span>
                      </div>
                      <div className={styles.approvalAmount}>
                        Amount: <span className={styles.amountValue}>••••••••</span>
                      </div>
                      {approval.status === 'pending' && (
                        <div className={styles.approvalActions}>
                          <button
                            onClick={() => handleApprove(approval.id)}
                            className={styles.approveBtn}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(approval.id)}
                            className={styles.rejectBtn}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'invite' && (
          <div className={styles.tabContent}>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Invite Team Member</h2>

              <div className="space-y-6">
                <div>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    placeholder="team@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div>
                  <label className={styles.label}>Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                    className={styles.select}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="approver">Approver</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className={styles.hint}>
                    Owner role cannot be assigned via invite
                  </p>
                </div>

                <button
                  onClick={handleInvite}
                  disabled={loading || !inviteEmail}
                  className={styles.inviteBtn}
                >
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
