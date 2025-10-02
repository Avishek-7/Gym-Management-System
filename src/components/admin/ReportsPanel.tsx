import type { ChangeEvent, FC, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import type { IncidentReport } from '../../types/reports';
import { Button } from '../ui/button';
import { Input } from '../ui/form-input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';

type IncidentDraft = Omit<IncidentReport, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

const createEmptyIncidentDraft = (): IncidentDraft => ({
  category: '',
  description: '',
  reportedUser: '',
});

interface ReportsPanelProps {
  reports: IncidentReport[];
  onReportSubmit: (payload: IncidentDraft) => Promise<void> | void;
  loading?: boolean;
}

const formatTimestamp = (timestamp?: Date | string) => {
  if (!timestamp) return 'Pending';
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'Pending' : date.toLocaleString();
};

const getStatusBadgeClasses = (status: IncidentReport['status']) => {
  switch (status) {
    case 'resolved':
      return 'bg-emerald-100 text-emerald-700';
    case 'in_progress':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const ReportsPanel: FC<ReportsPanelProps> = ({ reports, onReportSubmit, loading = false }) => {
  const [formState, setFormState] = useState<IncidentDraft>(createEmptyIncidentDraft);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reportTypeOptions = useMemo(() => {
    const existingTypes = Array.from(new Set(reports.map((report) => report.category).filter(Boolean)));
    return existingTypes.length > 0 ? existingTypes : ['Misconduct', 'Equipment Issue', 'Billing', 'Other'];
  }, [reports]);

  const highlightedReports = useMemo(() => reports.slice(0, 5), [reports]);

  const handleTypeChange = (value: string) => {
    setFormState((prev) => ({ ...prev, category: value }));
    if (error) setError('');
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setFormState((prev) => ({ ...prev, description: event.currentTarget.value }));
    if (error) setError('');
  };

  const handleReportedUserChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, reportedUser: event.currentTarget.value }));
    if (error) setError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedDescription = formState.description.trim();
    const trimmedReportedUser = formState.reportedUser.trim();

    if (!formState.category || !trimmedDescription || !trimmedReportedUser) {
      setError('All fields are required.');
      return;
    }

    const payload: IncidentDraft = {
      category: formState.category,
      description: trimmedDescription,
      reportedUser: trimmedReportedUser,
    };

    try {
      setSubmitting(true);
      await Promise.resolve(onReportSubmit(payload));
      setFormState(createEmptyIncidentDraft());
      setError('');
    } catch (submissionError) {
      console.error('Failed to submit incident report:', submissionError);
      setError('Failed to submit the report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled =
    submitting ||
    !formState.category ||
    !formState.description.trim() ||
    !formState.reportedUser.trim();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit a Report</CardTitle>
          <CardDescription>Log any incidents, equipment issues, or policy violations.</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Report type</label>
                <Select value={formState.category} onValueChange={handleTypeChange}>
                  <SelectTrigger disabled={submitting}>
                    <SelectValue placeholder="Select a report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground" htmlFor="reported-user">
                  Reported member / staff
                </label>
                <Input
                  id="reported-user"
                  placeholder="Enter the person’s full name"
                  value={formState.reportedUser}
                  onChange={handleReportedUserChange}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="report-description">
                Description
              </label>
              <Textarea
                id="report-description"
                placeholder="Describe the incident or issue in detail"
                rows={5}
                value={formState.description}
                onChange={handleDescriptionChange}
                disabled={submitting}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitDisabled}>
                {submitting ? 'Submitting…' : 'Submit report'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent reports</CardTitle>
          <CardDescription>Quick snapshot of the latest submissions.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading reports…</p>
          ) : highlightedReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports submitted yet.</p>
          ) : (
            highlightedReports.map((report) => (
              <div key={`report-${report.id}`} className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{report.category}</span>
                  <span className="text-xs text-muted-foreground">{formatTimestamp(report.createdAt)}</span>
                </div>
                {report.status && (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClasses(
                      report.status,
                    )}`}
                  >
                    {report.status.replace('_', ' ')}
                  </span>
                )}
                <p className="text-sm font-semibold">{report.reportedUser}</p>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPanel;
