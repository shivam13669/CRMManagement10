import { useState, useEffect } from "react";
import { StaffLayout } from "../components/StaffLayout";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  Calendar,
  Download,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";

interface StaffStats {
  totalAssigned: number;
  completedRequests: number;
  averageResponseTime: string;
  monthlyCompletion: number;
  weeklyStats: {
    week: string;
    completed: number;
    assigned: number;
  }[];
  recentActivity: {
    date: string;
    action: string;
    details: string;
    type: 'assignment' | 'completion' | 'update';
  }[];
}

export default function StaffReports() {
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const userName = localStorage.getItem('userName') || 'Staff';

  useEffect(() => {
    fetchStaffStats();
  }, [selectedPeriod]);

  const fetchStaffStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/staff/reports?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        console.error('Failed to fetch staff stats:', response.status);
        // Mock data for now
        setStats({
          totalAssigned: 12,
          completedRequests: 10,
          averageResponseTime: "8.5 minutes",
          monthlyCompletion: 83,
          weeklyStats: [
            { week: "Week 1", completed: 3, assigned: 4 },
            { week: "Week 2", completed: 2, assigned: 3 },
            { week: "Week 3", completed: 3, assigned: 3 },
            { week: "Week 4", completed: 2, assigned: 2 },
          ],
          recentActivity: [
            {
              date: new Date().toISOString(),
              action: "Completed Emergency Request",
              details: "Heart attack - City Hospital",
              type: 'completion'
            },
            {
              date: new Date(Date.now() - 86400000).toISOString(),
              action: "Assigned New Request",
              details: "Accident case - Main Street",
              type: 'assignment'
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching staff stats:', error);
      // Use mock data on error
      setStats({
        totalAssigned: 0,
        completedRequests: 0,
        averageResponseTime: "N/A",
        monthlyCompletion: 0,
        weeklyStats: [],
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    // Generate CSV report
    const csvContent = `Staff Performance Report - ${userName}
Period: Last ${selectedPeriod} days
Generated: ${new Date().toLocaleString()}

Summary:
Total Assigned Requests: ${stats?.totalAssigned || 0}
Completed Requests: ${stats?.completedRequests || 0}
Completion Rate: ${stats?.monthlyCompletion || 0}%
Average Response Time: ${stats?.averageResponseTime || 'N/A'}

Weekly Breakdown:
${stats?.weeklyStats.map(week => `${week.week}: ${week.completed}/${week.assigned} completed`).join('\n') || 'No data'}

Recent Activity:
${stats?.recentActivity.map(activity => `${new Date(activity.date).toLocaleDateString()}: ${activity.action} - ${activity.details}`).join('\n') || 'No recent activity'}
`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `staff-report-${userName}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </StaffLayout>
    );
  }

  const completionRate = stats ? Math.round((stats.completedRequests / stats.totalAssigned) * 100) || 0 : 0;

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Performance Reports</h1>
            <p className="text-gray-600 mt-2">
              Track your ambulance service performance and activity
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
              </select>
            </div>
            <Button onClick={downloadReport} size="sm" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Download Report</span>
            </Button>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Assigned
              </CardTitle>
              <Truck className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalAssigned || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last {selectedPeriod} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completed
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.completedRequests || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Successfully handled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {completionRate}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Success percentage
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.averageResponseTime || 'N/A'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Time to respond
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Weekly Performance</span>
              </CardTitle>
              <CardDescription>
                Your weekly assignment and completion stats
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.weeklyStats && stats.weeklyStats.length > 0 ? (
                <div className="space-y-4">
                  {stats.weeklyStats.map((week, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{week.week}</span>
                        <span className="text-gray-500">
                          {week.completed}/{week.assigned} completed
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: week.assigned > 0 ? `${(week.completed / week.assigned) * 100}%` : '0%'
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Your recent ambulance service activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'completion' ? 'bg-green-500' :
                        activity.type === 'assignment' ? 'bg-blue-500' : 'bg-orange-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">
                          {activity.action}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {activity.details}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(activity.date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <TrendingUp className="h-5 w-5" />
              <span>Performance Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-900 mb-2">Strengths</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  {completionRate >= 80 && (
                    <li>• Excellent completion rate ({completionRate}%)</li>
                  )}
                  {stats && stats.totalAssigned > 5 && (
                    <li>• High activity level with {stats.totalAssigned} assignments</li>
                  )}
                  <li>• Contributing to emergency response efficiency</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Areas for Growth</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {completionRate < 80 && (
                    <li>• Focus on improving completion rate</li>
                  )}
                  <li>• Continue reducing response times</li>
                  <li>• Maintain consistent performance across weeks</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Note */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Staff Reports Information
                </h4>
                <p className="text-sm text-blue-700">
                  These reports show your personal performance metrics for ambulance service assignments. 
                  Data includes only requests that were assigned to you and your completion rates. 
                  Reports are updated in real-time as you complete assignments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}
