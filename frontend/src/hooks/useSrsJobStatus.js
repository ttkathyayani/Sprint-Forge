import { useState, useEffect } from "react";
import api, { apiError } from "@/lib/api";

const useSrsJobStatus = (projectId, jobId, onComplete, onError) => {
  const [job, setJob] = useState(null);
  const [isPolling, setIsPolling] = useState(Boolean(jobId));

  useEffect(() => {
    if (!projectId || !jobId) {
      setIsPolling(false);
      return undefined;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await api.get(
          `/projects/${projectId}/srs/jobs/${jobId}/status`
        );

        if (cancelled) return;

        setJob(response.data);

        if (response.data.status === "done") {
          setIsPolling(false);
          onComplete?.(response.data);
        } else if (response.data.status === "error") {
          setIsPolling(false);
          onError?.(response.data.error || "SRS processing failed");
        } else {
          setIsPolling(true);
        }
      } catch (error) {
        if (cancelled) return;

        setIsPolling(false);
        onError?.(apiError(error));
      }
    };

    poll();
    const pollInterval = setInterval(poll, 2000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [projectId, jobId, onComplete, onError]);

  return { job, isPolling };
};

export default useSrsJobStatus;