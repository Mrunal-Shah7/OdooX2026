import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  Mail,
  MapPin,
  Phone,
  Shield,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';
import { apiFetch } from '../../lib/apiFetch';
import { useSession } from '../../lib/session';

type ProfileResponse = {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    personalEmail: string | null;
    phone: string | null;
    jobPosition: string;
    employeeType: string;
    status: string;
    joiningDate: string;
    workLocation: string | null;
    bankName: string | null;
    bankAccountHolder: string | null;
    bankAccountNumber: string | null;
    bankIfsc: string | null;
    department: { id: string; name: string; code: string } | null;
    manager: { id: string; firstName: string; lastName: string } | null;
    workingSchedule: { id: string; name: string; timezone: string } | null;
  } | null;
  counts?: {
    contracts: number;
    attendance: number;
    timeOff: number;
    allocations: number;
  };
};

export default function ProfilePage() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  // Mode state for inline editing
  const [isEditing, setIsEditing] = useState(false);

  // Profile form state
  const [personalEmail, setPersonalEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Feedback states
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Fetch full employee profile
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiFetch<{ data: ProfileResponse | null }>('/profile'),
    enabled: !!user,
  });

  const resData = profileData?.data;
  const emp = resData?.employee ?? null;
  const counts = resData?.counts ?? { contracts: 0, attendance: 0, timeOff: 0, allocations: 0 };

  // Init form values from profile data
  useEffect(() => {
    if (emp) {
      setPersonalEmail(emp.personalEmail ?? '');
      setPhone(emp.phone ?? '');
      setWorkLocation(emp.workLocation ?? '');
      setBankName(emp.bankName ?? '');
      setBankAccountHolder(emp.bankAccountHolder ?? '');
      setBankAccountNumber(emp.bankAccountNumber ?? '');
      setBankIfsc(emp.bankIfsc ?? '');
    }
  }, [emp]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      setProfileError(null);
      setProfileSuccess(null);
      return apiFetch<{ data: ProfileResponse }>('/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          personalEmail: personalEmail.trim() || null,
          phone: phone.trim() || null,
          workLocation: workLocation.trim() || null,
          bankName: bankName.trim() || null,
          bankAccountHolder: bankAccountHolder.trim() || null,
          bankAccountNumber: bankAccountNumber.trim() || null,
          bankIfsc: bankIfsc.trim() || null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setIsEditing(false);
      setProfileSuccess('Profile updated successfully.');
      setTimeout(() => setProfileSuccess(null), 4000);
    },
    onError: (err: any) => {
      setProfileError(err.message || 'Failed to update profile.');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      setPasswordError(null);
      setPasswordSuccess(null);

      if (!currentPassword) {
        throw new Error('Please enter your current password.');
      }
      if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long.');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('New password and confirm password do not match.');
      }

      return apiFetch<void>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Password changed successfully.');
      setTimeout(() => setPasswordSuccess(null), 4000);
    },
    onError: (err: any) => {
      setPasswordError(err.message || 'Failed to change password.');
    },
  });

  // Avatar initials generator
  const initials = emp
    ? `${emp.firstName.charAt(0)}${emp.lastName.charAt(0)}`.toUpperCase()
    : user?.email.substring(0, 2).toUpperCase() ?? 'U';

  const fullName = emp ? `${emp.firstName} ${emp.lastName}` : user?.email ?? 'User';

  return (
    <>
      <PageHeader
        title="User Profile"
        subtitle="Manage your personal information, contact preferences, and account security"
      />

      <div className="px-5 pb-8 space-y-6">
        {/* Profile Hero Header Card */}
        <Card className="overflow-hidden border-border shadow-sm">
          <div className="bg-surface-subtle border-b border-border px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="size-20 rounded-full bg-accent text-on-accent font-bold text-h1 flex items-center justify-center shadow-md shrink-0">
                {initials}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-h2 font-bold text-text m-0">{fullName}</h2>
                  <Badge variant={user?.status === 'active' ? 'success' : 'neutral'}>
                    {user?.status ?? 'active'}
                  </Badge>
                  <Badge variant="info" className="uppercase tracking-wider">
                    {user?.role ?? 'employee'}
                  </Badge>
                </div>
                <p className="text-body-sm text-text-muted m-0 flex items-center gap-2">
                  <span>{emp?.jobPosition ?? 'Team Member'}</span>
                  <span>•</span>
                  <span>{emp?.department?.name ?? 'General'}</span>
                  {emp?.workLocation && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {emp.workLocation}
                      </span>
                    </>
                  )}
                </p>
                <p className="text-caption font-mono text-text-muted m-0 pt-1">
                  Email: {user?.email}
                </p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-3">
              {emp && (
                <Button
                  variant={isEditing ? 'secondary' : 'accent'}
                  onClick={() => {
                    setProfileError(null);
                    setIsEditing(!isEditing);
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="size-4" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          {emp && (
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border bg-surface text-body-sm">
              <Link
                to="/payroll/payslips"
                className="p-4 hover:bg-surface-subtle transition-colors no-underline text-text flex items-center gap-3"
              >
                <FileText className="size-5 text-accent shrink-0" />
                <div>
                  <span className="text-caption text-text-muted block">Contracts</span>
                  <span className="font-mono font-bold text-text">{counts.contracts} active</span>
                </div>
              </Link>

              <Link
                to="/time-off/requests"
                className="p-4 hover:bg-surface-subtle transition-colors no-underline text-text flex items-center gap-3"
              >
                <Calendar className="size-5 text-info shrink-0" />
                <div>
                  <span className="text-caption text-text-muted block">Time Off Requests</span>
                  <span className="font-mono font-bold text-text">{counts.timeOff} requests</span>
                </div>
              </Link>

              <Link
                to="/attendance"
                className="p-4 hover:bg-surface-subtle transition-colors no-underline text-text flex items-center gap-3"
              >
                <Clock className="size-5 text-success shrink-0" />
                <div>
                  <span className="text-caption text-text-muted block">Attendance Logs</span>
                  <span className="font-mono font-bold text-text">{counts.attendance} records</span>
                </div>
              </Link>

              <div className="p-4 flex items-center gap-3">
                <Building2 className="size-5 text-warning shrink-0" />
                <div>
                  <span className="text-caption text-text-muted block">Work Schedule</span>
                  <span className="font-medium text-text">
                    {emp.workingSchedule?.name ?? 'Standard'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Global Feedback Banner */}
        {profileSuccess && (
          <div className="rounded-md bg-success-subtle p-4 text-body-sm text-success border border-success flex items-center gap-2">
            <CheckCircle2 className="size-5 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="rounded-md bg-danger-subtle p-4 text-body-sm text-danger border border-danger">
            {profileError}
          </div>
        )}

        {/* Main Tabbed Profile Layout */}
        <Tabs
          defaultValue="details"
          items={[
            {
              value: 'details',
              label: 'Personal & Contact Info',
              content: (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                  {/* Primary Info Box */}
                  <Card className="lg:col-span-2">
                    <CardHeader
                      title="Contact & Personal Details"
                      subtitle="Your personal contact information and work location"
                      actions={
                        emp && !isEditing ? (
                          <Button
                            variant="secondary"
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1.5 text-caption"
                          >
                            <Edit3 className="size-3.5" />
                            <span>Edit</span>
                          </Button>
                        ) : null
                      }
                    />
                    <CardBody>
                      {isEditing ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            updateProfileMutation.mutate();
                          }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Personal Email">
                              <Input
                                type="email"
                                value={personalEmail}
                                onChange={(e) => setPersonalEmail(e.target.value)}
                                placeholder="personal@example.com"
                              />
                            </Field>

                            <Field label="Phone Number">
                              <Input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+91 9876543210"
                              />
                            </Field>
                          </div>

                          <Field label="Work Location / Office Address">
                            <Input
                              value={workLocation}
                              onChange={(e) => setWorkLocation(e.target.value)}
                              placeholder="e.g. Building 4, Tech Park, Mumbai"
                            />
                          </Field>

                          <div className="flex justify-end gap-3 pt-4 border-t border-border">
                            <Button variant="secondary" type="button" onClick={() => setIsEditing(false)}>
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              variant="accent"
                              disabled={updateProfileMutation.isPending}
                            >
                              {updateProfileMutation.isPending ? 'Saving...' : 'Save Details'}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-body-sm">
                          <div className="flex items-start gap-3 p-3 rounded-md bg-surface-subtle border border-border/60">
                            <Mail className="size-5 text-accent mt-0.5 shrink-0" />
                            <div>
                              <span className="text-caption text-text-muted block">Work Email</span>
                              <span className="font-mono text-text font-medium">{user?.email}</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 rounded-md bg-surface-subtle border border-border/60">
                            <Mail className="size-5 text-info mt-0.5 shrink-0" />
                            <div>
                              <span className="text-caption text-text-muted block">Personal Email</span>
                              <span className="font-mono text-text">
                                {personalEmail || 'Not set'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 rounded-md bg-surface-subtle border border-border/60">
                            <Phone className="size-5 text-success mt-0.5 shrink-0" />
                            <div>
                              <span className="text-caption text-text-muted block">Phone Number</span>
                              <span className="font-mono text-text">{phone || 'Not set'}</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 rounded-md bg-surface-subtle border border-border/60">
                            <MapPin className="size-5 text-warning mt-0.5 shrink-0" />
                            <div>
                              <span className="text-caption text-text-muted block">Work Location</span>
                              <span className="text-text">{workLocation || 'Not set'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardBody>
                  </Card>

                  {/* Bank Account Payout Box */}
                  <Card>
                    <CardHeader
                      title="Bank Account Payout"
                      subtitle="Salary payout account details"
                    />
                    <CardBody>
                      {isEditing ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            updateProfileMutation.mutate();
                          }}
                          className="space-y-4"
                        >
                          <Field label="Bank Name">
                            <Input
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              placeholder="e.g. HDFC Bank"
                            />
                          </Field>

                          <Field label="Account Holder Name">
                            <Input
                              value={bankAccountHolder}
                              onChange={(e) => setBankAccountHolder(e.target.value)}
                              placeholder="Name on bank account"
                            />
                          </Field>

                          <Field label="Account Number">
                            <Input
                              value={bankAccountNumber}
                              onChange={(e) => setBankAccountNumber(e.target.value)}
                              placeholder="Account number"
                            />
                          </Field>

                          <Field label="IFSC / Branch Code">
                            <Input
                              value={bankIfsc}
                              onChange={(e) => setBankIfsc(e.target.value)}
                              placeholder="IFSC code"
                            />
                          </Field>

                          <div className="pt-2">
                            <Button
                              type="submit"
                              variant="accent"
                              className="w-full"
                              disabled={updateProfileMutation.isPending}
                            >
                              {updateProfileMutation.isPending ? 'Saving...' : 'Update Bank Payout Info'}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4 text-body-sm">
                          <div className="flex justify-between border-b border-border/50 pb-2">
                            <span className="text-text-muted">Bank Name</span>
                            <span className="font-medium text-text">{bankName || 'Not configured'}</span>
                          </div>
                          <div className="flex justify-between border-b border-border/50 pb-2">
                            <span className="text-text-muted">Account Holder</span>
                            <span className="text-text">{bankAccountHolder || 'Not configured'}</span>
                          </div>
                          <div className="flex justify-between border-b border-border/50 pb-2">
                            <span className="text-text-muted">Account Number</span>
                            <span className="font-mono text-caption text-text">
                              {bankAccountNumber ? `•••• ${bankAccountNumber.slice(-4)}` : 'Not configured'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted">IFSC Code</span>
                            <span className="font-mono text-caption text-text">
                              {bankIfsc || 'Not configured'}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              ),
            },
            {
              value: 'employment',
              label: 'Employment & Structure',
              content: (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  <Card>
                    <CardHeader title="Organization & Position" />
                    <CardBody className="space-y-3 text-body-sm">
                      <div className="flex justify-between border-b border-border/50 pb-2.5">
                        <span className="text-text-muted">Job Position</span>
                        <span className="font-medium text-text">{emp?.jobPosition ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/50 pb-2.5">
                        <span className="text-text-muted">Department</span>
                        <span className="text-text font-medium">
                          {emp?.department?.name ?? 'Unassigned'} ({emp?.department?.code ?? '—'})
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-border/50 pb-2.5">
                        <span className="text-text-muted">Direct Manager</span>
                        <span className="text-text">
                          {emp?.manager
                            ? `${emp.manager.firstName} ${emp.manager.lastName}`
                            : 'No direct manager assigned'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-border/50 pb-2.5">
                        <span className="text-text-muted">Employee Type</span>
                        <span className="text-text capitalize">
                          {emp?.employeeType ? emp.employeeType.replace('_', ' ') : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Joining Date</span>
                        <span className="font-mono text-text">{emp?.joiningDate ?? 'N/A'}</span>
                      </div>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader title="Working Schedule & Shift" />
                    <CardBody className="space-y-3 text-body-sm">
                      <div className="flex justify-between border-b border-border/50 pb-2.5">
                        <span className="text-text-muted">Schedule Name</span>
                        <span className="font-medium text-text">
                          {emp?.workingSchedule?.name ?? 'Standard 40h/week'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-border/50 pb-2.5">
                        <span className="text-text-muted">Timezone</span>
                        <span className="font-mono text-caption text-text">
                          {emp?.workingSchedule?.timezone ?? 'UTC'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Status</span>
                        <Badge variant="success">Active Assignment</Badge>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              ),
            },
            {
              value: 'security',
              label: 'Security & Password',
              content: (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                  <Card className="lg:col-span-2">
                    <CardHeader
                      title="Change Password"
                      subtitle="Update your login password to secure your account"
                    />
                    <CardBody>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          changePasswordMutation.mutate();
                        }}
                        className="space-y-4 max-w-md"
                      >
                        {passwordError && (
                          <div className="rounded-md bg-danger-subtle p-3 text-body-sm text-danger border border-danger">
                            {passwordError}
                          </div>
                        )}
                        {passwordSuccess && (
                          <div className="rounded-md bg-success-subtle p-3 text-body-sm text-success border border-success">
                            {passwordSuccess}
                          </div>
                        )}

                        <Field label="Current Password">
                          <Input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                          />
                        </Field>

                        <Field label="New Password">
                          <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                            required
                          />
                        </Field>

                        <Field label="Confirm New Password">
                          <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            required
                          />
                        </Field>

                        <Button
                          type="submit"
                          variant="accent"
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                        </Button>
                      </form>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader title="Role & Access Control" />
                    <CardBody className="space-y-4 text-body-sm">
                      <div className="flex items-center gap-3 p-3 rounded-md bg-surface-subtle border border-border">
                        <Shield className="size-6 text-accent shrink-0" />
                        <div>
                          <span className="text-caption text-text-muted block">System Role</span>
                          <span className="font-semibold text-text uppercase tracking-wider">
                            {user?.role}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-text-muted text-body-xs">
                        <p className="m-0">
                          Your role permits access to assigned system modules per role capabilities matrix.
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
