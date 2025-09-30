import type { ChangeEvent, FC, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import Input from '../ui/input';
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
import type { Report } from '../../services/reports';

interface ReportsPanelProps {
  reports: Report[];
  onReportSubmit: (payload: Omit<Report, 'id' | 'status' | 'createdAt'>) => void;
}

const ReportsPanel: FC<ReportsPanelProps> = ({ reports, onReportSubmit }) => {
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [reportedUser, setReportedUser] = useState('');
  const [error, setError] = useState('');

  const reportTypeOptions = useMemo(() => {
    const existingTypes = Array.from(new Set(reports.map((report) => report.type)));
    return existingTypes.length > 0 ? existingTypes : ['Misconduct', 'Equipment Issue', 'Billing', 'Other'];
  }, [reports]);

  const highlightedReports = useMemo(
    () => reports.slice(0, 5).map((report) => ({ ...report, createdAt: report.createdAt })),
    [reports],
  );

  const handleTypeChange = (value: string) => {
    setReportType(value);
    if (error) setError('');
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.currentTarget.value);
    if (error) setError('');
  };

  const handleReportedUserChange = (event: ChangeEvent<HTMLInputElement>) => {
    setReportedUser(event.currentTarget.value);
    if (error) setError('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reportType || !description.trim() || !reportedUser.trim()) {
      setError('All fields are required.');
      return;
    }

    const payload: Omit<Report, 'id' | 'status' | 'createdAt'> = {
      type: reportType,
      description: description.trim(),
      reportedUser: reportedUser.trim(),
    };

    onReportSubmit(payload);

    setReportType('');
    setDescription('');
    setReportedUser('');
    setError('');
  };

  const isSubmitDisabled = !reportType || !description.trim() || !reportedUser.trim();

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
                <Select value={reportType} onValueChange={handleTypeChange}>
                  <SelectTrigger>
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
                  value={reportedUser}
                  onChange={handleReportedUserChange}
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
                value={description}
                onChange={handleDescriptionChange}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitDisabled}>
                Submit report
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
          {highlightedReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports submitted yet.</p>
          ) : (
            highlightedReports.map((report) => (
              <div key={`report-${report.id ?? `${report.reportedUser}-${report.createdAt}`}`} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{report.type}</span>
                  <span className="text-xs text-muted-foreground">
                    {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'Pending'}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">{report.reportedUser}</p>
                <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPanel;
