import { useState, useEffect, useRef } from "react";
import api, { apiError } from "@/lib/api";

const useSrsJobStatus = (projectId, jobId, onComplete, onError) => {
  const [job, setJob] = useState(null);
  const [isPolling, setIsPolling] = useState(Boolean(jobId));
  const completedRef = useRef(false);

  useEffect(() => {
    if (!projectId || !jobId) {
      setIsPolling(false);
      return undefined;
    }

    let cancelled = false;
    let pollInterval = null;
    completedRef.current = false;

    const stop = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      setIsPolling(false);
    };

    const poll = async () => {
      if (cancelled || completedRef.current) return;
      try {
        const response = await api.get(
          `/projects/${projectId}/srs/jobs/${jobId}/status`
        );

        if (cancelled || completedRef.current) return;

        setJob(response.data);

        if (response.data.status === "done") {
          completedRef.current = true;
          stop();
          onComplete?.(response.data);
        } else if (response.data.status === "error") {
          completedRef.current = true;
          stop();
          onError?.(response.data.error || "SRS processing failed");
        } else {
          setIsPolling(true);
        }
      } catch (error) {
        if (cancelled || completedRef.current) return;
        completedRef.current = true;
        stop();
        onError?.(apiError(error));
      }
    };

    poll();
    pollInterval = setInterval(poll, 2000);

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [projectId, jobId]);

  return { job, isPolling };
};

export default useSrsJobStatus;