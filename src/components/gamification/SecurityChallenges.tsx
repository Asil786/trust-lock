import { useState, useEffect } from 'react';
import { Trophy, Target, Zap, Crown, Star, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  progress: number;
  maxProgress: number;
  type: 'password' | 'security' | 'streak' | 'education';
  difficulty: 'easy' | 'medium' | 'hard';
  rewards: string[];
}

interface UserStats {
  totalPoints: number;
  level: number;
  streak: number;
  badges: string[];
  completedChallenges: string[];
}

const initialChallenges: Challenge[] = [
  {
    id: 'first-strong-password',
    title: 'Create Your First Strong Password',
    description: 'Generate a password with strength score of 3 or higher',
    points: 100,
    completed: false,
    progress: 0,
    maxProgress: 1,
    type: 'password',
    difficulty: 'easy',
    rewards: ['Security Novice Badge']
  },
  {
    id: 'unique-champion',
    title: 'Unique Password Champion',
    description: 'Have 10 unique passwords in your vault',
    points: 300,
    completed: false,
    progress: 0,
    maxProgress: 10,
    type: 'password',
    difficulty: 'medium',
    rewards: ['Unique Champion Badge', '50 XP Bonus']
  },
  {
    id: 'mfa-master',
    title: 'Multi-Factor Master',
    description: 'Enable MFA for your SecureVault account',
    points: 200,
    completed: false,
    progress: 0,
    maxProgress: 1,
    type: 'security',
    difficulty: 'easy',
    rewards: ['Security Expert Badge']
  },
  {
    id: 'seven-day-streak',
    title: 'Weekly Security Check',
    description: 'Check your vault security 7 days in a row',
    points: 500,
    completed: false,
    progress: 0,
    maxProgress: 7,
    type: 'streak',
    difficulty: 'hard',
    rewards: ['Consistency Master Badge', 'Level Up Bonus']
  }
];

export function SecurityChallenges({ vaultEntries }: { vaultEntries: any[] }) {
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    level: 1,
    streak: 0,
    badges: [],
    completedChallenges: []
  });
  const { toast } = useToast();

  useEffect(() => {
    updateChallengeProgress();
  }, [vaultEntries]);

  const updateChallengeProgress = () => {
    setChallenges(prev => prev.map(challenge => {
      let newProgress = challenge.progress;
      
      switch (challenge.id) {
        case 'unique-champion':
          newProgress = Math.min(vaultEntries.length, challenge.maxProgress);
          break;
        case 'first-strong-password':
          // This would be updated when a strong password is created
          break;
        default:
          break;
      }
      
      const wasCompleted = challenge.completed;
      const isCompleted = newProgress >= challenge.maxProgress;
      
      if (!wasCompleted && isCompleted) {
        completeChallenge(challenge);
      }
      
      return {
        ...challenge,
        progress: newProgress,
        completed: isCompleted
      };
    }));
  };

  const completeChallenge = (challenge: Challenge) => {
    setUserStats(prev => {
      const newTotalPoints = prev.totalPoints + challenge.points;
      const newLevel = Math.floor(newTotalPoints / 1000) + 1;
      
      return {
        ...prev,
        totalPoints: newTotalPoints,
        level: newLevel,
        badges: [...prev.badges, ...challenge.rewards.filter(r => r.includes('Badge'))],
        completedChallenges: [...prev.completedChallenges, challenge.id]
      };
    });

    toast({
      title: "Challenge Completed! 🎉",
      description: `You earned ${challenge.points} points for "${challenge.title}"`,
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'password': return <Target className="h-4 w-4" />;
      case 'security': return <Zap className="h-4 w-4" />;
      case 'streak': return <Crown className="h-4 w-4" />;
      case 'education': return <Star className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* User Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your Security Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userStats.totalPoints}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">Level {userStats.level}</div>
              <div className="text-sm text-muted-foreground">Current Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userStats.streak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userStats.badges.length}</div>
              <div className="text-sm text-muted-foreground">Badges Earned</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Challenges */}
      <Card>
        <CardHeader>
          <CardTitle>Security Challenges</CardTitle>
          <CardDescription>
            Complete challenges to earn points and improve your security habits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`p-4 border rounded-lg transition-all ${
                  challenge.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-card border-border hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {challenge.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      getTypeIcon(challenge.type)
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{challenge.title}</h4>
                      <Badge className={`text-xs ${getDifficultyColor(challenge.difficulty)}`}>
                        {challenge.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {challenge.points} pts
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {challenge.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">
                          {challenge.progress} / {challenge.maxProgress}
                        </span>
                      </div>
                      <Progress 
                        value={(challenge.progress / challenge.maxProgress) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    {challenge.rewards.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground mb-1">Rewards:</div>
                        <div className="flex flex-wrap gap-1">
                          {challenge.rewards.map((reward, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {reward}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Badges Collection */}
      {userStats.badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Badge Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {userStats.badges.map((badge, index) => (
                <div key={index} className="text-center p-3 border rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                  <Trophy className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                  <div className="text-xs font-medium text-yellow-800">{badge}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}