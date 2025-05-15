import { useEffect, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assessmentApi, type Assessment } from '@/src/api/assessment';
import { toast } from 'sonner';
import PageTransition from '../page-transitions';

export default function HistoryPage() {
  // #actual
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatValue = (value: string | undefined): string => {
    if (!value) return 'Not provided';

    if (value === 'not-sure') return 'Not sure';
    if (value === 'varies') return 'Varies';
    if (value === 'under-13') return 'Under 13';
    if (value === '8-plus') return '8+ days';

    return value
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown date';

    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Invalid date';
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.warn(error);
      return 'Invalid date';
    }
  };

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const data = await assessmentApi.list();
        setAssessments(data);
        console.log('Fetched assessments:', data);
        setError(null);
      } catch (error) {
        console.error('Error fetching assessments:', error);
        setError('Unable to load your assessments. Please try again later.');
        toast.error('Failed to load assessments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-600 dark:text-slate-200">Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Assessment History
            </h1>
            <Link
              to="/assessment/age-verification"
              className="inline-flex items-center rounded-lg bg-pink-500 px-4 py-2 text-white transition-colors hover:bg-pink-600 dark:bg-pink-500 dark:hover:bg-pink-600"
            >
              New Assessment
            </Link>
          </div>

          {error ? (
            <div className="rounded-lg border bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 text-red-500 dark:text-red-400">⚠️</div>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">
                {error}
              </h3>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex w-full items-center rounded-lg bg-pink-500 px-4 py-2 text-white transition-colors hover:bg-pink-600 dark:bg-pink-500 dark:hover:bg-pink-600"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : assessments.length === 0 ? (
            <div className="rounded-lg border bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">
                No assessments yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-300">
                Start your first assessment to track your menstrual health.
              </p>
              <div className="mt-6">
                <Link
                  to="/assessment"
                  className="inline-flex items-center rounded-lg bg-pink-500 px-4 py-2 text-white transition-colors hover:bg-pink-600 dark:bg-pink-500 dark:hover:bg-pink-600"
                >
                  Start Assessment
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => {
                const data = assessment?.assessment_data;

                return (
                  <Link
                    key={assessment.id}
                    to={`/assessment/history/${assessment.id}`}
                    className="block rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-2 text-xs font-medium text-pink-800 dark:bg-pink-900/30 dark:text-pink-400">
                            {formatValue(data?.pattern)}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-slate-300">
                            {formatDate(data?.date)}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 dark:text-slate-200">
                          <p>
                            <span className="font-medium text-gray-900 dark:text-slate-100">
                              Age:
                            </span>{' '}
                            {formatValue(data?.age)}
                            {data?.age && data.age !== 'under-13' ? ' years' : ''}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900 dark:text-slate-100">
                              Cycle Length:
                            </span>{' '}
                            {formatValue(data?.cycleLength)}
                            {data?.cycleLength &&
                            !['other', 'varies', 'not-sure'].includes(data.cycleLength)
                              ? ' days'
                              : ''}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 dark:text-slate-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
