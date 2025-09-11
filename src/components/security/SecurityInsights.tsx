import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Award, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SecurityAnalysis {
  securityScore: number;
  issues: Array<{
    type: string;
    severity: string;
    message: string;
    entryIds: string[];
  }>;
  recommendations: string[];
  stats: {
    totalPasswords: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    reusedPasswords: number;
  };
}

interface UserProgress {
  securityScore: number;
  badgesEarned: string[];
  streakDays: number;
  challengesCompleted: number;
  level: number;
}

export function SecurityInsights({ entries }: { entries: any[] }) {
  const [analysis, setAnalysis] = useState<SecurityAnalysis | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    securityScore: 0,
    badgesEarned: [],
    streakDays: 0,
    challengesCompleted: 0,
    level: 1
  });
  const [loading, setLoading] = useState(false);
  const [breachCheckLoading, setBreachCheckLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (entries.length > 0) {
      analyzePasswords();
    }
  }, [entries]);

  const analyzePasswords = async () => {
    setLoading(true);
    try {
      const passwordData = entries.map(entry => ({
        id: entry.id,
        password: entry.password,
        url: entry.url,
        title: entry.title
      }));

      const { data, error } = await supabase.functions.invoke('analyze-passwords', {
        body: { passwords: passwordData }
      });

      if (error) throw error;

      setAnalysis(data);
      setUserProgress(prev => ({
        ...prev,
        securityScore: data.securityScore,
        level: Math.floor(data.securityScore / 20) + 1
      }));

      // Award badges based on security score
      const newBadges = [];
      if (data.securityScore >= 90) newBadges.push('Security Master');
      if (data.securityScore >= 80) newBadges.push('Password Pro');
      if (data.stats.reusedPasswords === 0) newBadges.push('Unique Champion');
      if (data.stats.criticalIssues === 0) newBadges.push('No Critical Issues');

      setUserProgress(prev => ({
        ...prev,
        badgesEarned: [...new Set([...prev.badgesEarned, ...newBadges])]
      }));

    } catch (error) {
      console.error('Error analyzing passwords:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze password security",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkForBreaches = async () => {
    if (!user?.email) return;

    setBreachCheckLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-breaches', {
        body: { 
          email: user.email,
          userId: user.id 
        }
      });

      if (error) throw error;

      if (data.breachCount > 0) {
        toast({
          title: "Security Alert",
          description: `Your email was found in ${data.breachCount} data breaches. Check your alerts for details.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Good News!",
          description: "Your email was not found in any known data breaches.",
        });
      }
    } catch (error) {
      console.error('Error checking breaches:', error);
      toast({
        title: "Breach Check Failed",
        description: "Could not check for data breaches at this time",
        variant: "destructive"
      });
    } finally {
      setBreachCheckLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'Security Master': return <Award className="h-4 w-4" />;
      case 'Password Pro': return <Shield className="h-4 w-4" />;
      case 'Unique Champion': return <Target className="h-4 w-4" />;
      case 'No Critical Issues': return <CheckCircle className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <CardTitle className="mb-2">No Data to Analyze</CardTitle>
          <CardDescription>Add some passwords to see your security insights</CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Score & Gamification */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(analysis?.securityScore || 0)}`}>
                  {analysis?.securityScore || 0}
                </div>
                <p className="text-sm text-muted-foreground">out of 100</p>
              </div>
              <Progress value={analysis?.securityScore || 0} className="h-3" />
              <div className="flex justify-between text-sm">
                <span>Level {userProgress.level}</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {userProgress.streakDays} day streak
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userProgress.badgesEarned.length > 0 ? (
                userProgress.badgesEarned.map((badge) => (
                  <Badge key={badge} variant="secondary" className="flex items-center gap-2">
                    {getBadgeIcon(badge)}
                    {badge}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No badges earned yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Issues */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Security Issues
            </CardTitle>
            <CardDescription>
              Found {analysis.issues.length} issues across {analysis.stats.totalPasswords} passwords
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.issues.length > 0 ? (
                analysis.issues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{issue.message}</span>
                        <Badge variant={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Affects {issue.entryIds.length} password{issue.entryIds.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium">No security issues found!</p>
                  <p className="text-sm text-muted-foreground">Your passwords are secure</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analysis?.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button 
          onClick={analyzePasswords} 
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Analyzing...' : 'Re-analyze Passwords'}
        </Button>
        <Button 
          onClick={checkForBreaches}
          disabled={breachCheckLoading}
          variant="outline"
        >
          {breachCheckLoading ? 'Checking...' : 'Check for Breaches'}
        </Button>
      </div>
    </div>
  );
}