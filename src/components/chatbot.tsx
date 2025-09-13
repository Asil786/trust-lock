
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const chatbot = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const handleIframeLoad = () => {
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-7xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>AI chatbot Assistant</CardTitle>
            <CardDescription>
              Ask questions about data, predictions, and insights
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/predictions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <div className="w-full h-[calc(100vh-180px)] min-h-[500px]">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-b-2 border-transparent mb-3"></div>
                  <p className="text-muted-foreground">Loading AI Assistant...</p>
                </div>
              </div>
            )}
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full"
            >
              <iframe 
            //   https://labs.heygen.com/interactive-avatar/share?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJQZWRyb19DYXN1YWxMb29rX3B1YmxpYyIs%0D%0AInByZXZpZXdJbWciOiJodHRwczovL2ZpbGVzMi5oZXlnZW4uYWkvYXZhdGFyL3YzLzRjYTdlYjc0%0D%0ANDJmNzRmZTBiYmNjMjA1ZjNmZTZmMjcxXzU1OTAwL3ByZXZpZXdfdGFyZ2V0LndlYnAiLCJuZWVk%0D%0AUmVtb3ZlQmFja2dyb3VuZCI6ZmFsc2UsImtub3dsZWRnZUJhc2VJZCI6ImYxMTZkOWNlZmM5NzQz%0D%0AYWU5NGNmMDc0YWRmYWRmMzIzIiwidXNlcm5hbWUiOiJhMjNiYzM5YzE5ZmQ0ZTJkYjkzN2FlMzhh%0D%0AOGEzMDZjZCJ9
                src="https://labs.heygen.com/interactive-avatar/share?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJQZWRyb19DYXN1YWxMb29rX3B1YmxpYyIs%0D%0AInByZXZpZXdJbWciOiJodHRwczovL2ZpbGVzMi5oZXlnZW4uYWkvYXZhdGFyL3YzLzRjYTdlYjc0%0D%0ANDJmNzRmZTBiYmNjMjA1ZjNmZTZmMjcxXzU1OTAwL3ByZXZpZXdfdGFyZ2V0LndlYnAiLCJuZWVk%0D%0AUmVtb3ZlQmFja2dyb3VuZCI6ZmFsc2UsImtub3dsZWRnZUJhc2VJZCI6ImYxMTZkOWNlZmM5NzQz%0D%0AYWU5NGNmMDc0YWRmYWRmMzIzIiwidXNlcm5hbWUiOiJhMjNiYzM5YzE5ZmQ0ZTJkYjkzN2FlMzhh%0D%0AOGEzMDZjZCJ9&inIFrame=1"
                allow="microphone"
                onLoad={handleIframeLoad}
                allowFullScreen
                className="w-full h-full border-none rounded-b-lg"
              />
            </motion.div>
          </div>
        </CardContent>
      </Card>
      
      <div className="max-w-7xl mx-auto mt-4 text-sm text-muted-foreground text-center">
        <p>
          This AI assistant can analyze data predictions and insights on time series model results.
          Try asking about trends, seasonality, or prediction confidence.
        </p>
      </div>
    </div>
  );
};

export default chatbot;
