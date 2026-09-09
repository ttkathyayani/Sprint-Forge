import { useState, useEffect } from 'react';
import axios from 'axios';

const useSrsJobStatus = (projectId, jobId, onComplete, onError) => {
  const [job, setJob] = useState(null);
  const [isPolling, setIsPolling] = useState(!!jobId);

  useEffect(() => {
    if (!projectId || !jobId) return;

    let pollInterval;
    const poll = async () => {
      try {
        const response = await axios.get(
          `/api/projects/${projectId}/srs/jobs/${jobId}/status`
        );
        setJob(response.data);

        if (response.data.status === 'done') {
          setIsPolling(false);
          if (onComplete) onComplete(response.data);
        } else if (response.data.status === 'error') {
          setIsPolling(false);
          if (onError) onError(response.data.error);
        } else {
            setIsPolling(true);
        }
      } catch (error) {
        setIsPolling(false);
        if (onError) onError(error.message);
      }
    };

    // Poll every 2 seconds
    pollInterval = setInterval(poll, 2000);
    // Also poll immediately
    poll();

    return () => clearInterval(pollInterval);
  }, [projectId, jobId]);

  return { job, isPolling };
};

export default useSrsJobStatus;
