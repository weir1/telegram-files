package telegram.files;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class AvgSpeed {
    private final int interval;

    private final TreeMap<Long, SpeedPoint> speedPoints;

    private final int smoothingWindowSize;

    /**
     * @param speed Speed since last point
     */
    record SpeedPoint(long downloadedSize, long speed) {
    }

    public AvgSpeed() {
        this(15 * 60); // Default interval is 15 minutes
    }

    public AvgSpeed(int interval) {
        this(interval, 5);
    }

    public AvgSpeed(int interval, int smoothingWindowSize) {
        this.interval = interval;
        this.speedPoints = new TreeMap<>();
        this.smoothingWindowSize = smoothingWindowSize;
    }

    /**
     * Update download progress
     */
    public void update(long downloadedSize, long timestamp) {
        if (downloadedSize <= 0) {
            return;
        }
        // Calculate speed since last point
        long speed = calculateSpeed(downloadedSize, timestamp);

        // Apply smoothing if we have enough points
        if (speedPoints.size() >= smoothingWindowSize) {
            speed = smoothSpeed(speed);
        }

        // Add new speed point
        speedPoints.put(timestamp, new SpeedPoint(downloadedSize, speed));

        // Remove old points outside the interval
        long cutoffTime = timestamp - interval * 1000L; // Convert interval to milliseconds
        speedPoints.headMap(cutoffTime).clear();
    }

    private long calculateSpeed(long downloadedSize, long timestamp) {
        if (speedPoints.isEmpty()) {
            return 0;
        }

        Map.Entry<Long, SpeedPoint> lastEntry = speedPoints.lastEntry();
        long timeDiff = timestamp - lastEntry.getKey();
        if (timeDiff <= 0) {
            return 0;
        }

        long bytesDiff = downloadedSize - lastEntry.getValue().downloadedSize;
        if (bytesDiff < 0) {
            // Handle download restart
            bytesDiff = downloadedSize;
        }

        return (bytesDiff * 1000L) / timeDiff; // Speed in bytes per second
    }

    private long smoothSpeed(long currentSpeed) {
        if (speedPoints.isEmpty()) {
            return currentSpeed;
        }

        List<Long> recentSpeeds = speedPoints.values().stream()
                .skip(Math.max(0, speedPoints.size() - smoothingWindowSize))
                .map(point -> point.speed)
                .collect(Collectors.toList());
        recentSpeeds.add(currentSpeed);

        if (recentSpeeds.size() < 2) {
            return currentSpeed;
        }

        double mean = recentSpeeds.stream()
                .mapToLong(Long::longValue)
                .average()
                .orElse(currentSpeed);

        double standardDeviation = Math.sqrt(
                recentSpeeds.stream()
                        .mapToDouble(speed -> {
                            double diff = speed - mean;
                            return diff * diff;
                        })
                        .average()
                        .orElse(0.0)
        );

        double upperThreshold = mean + (2 * standardDeviation);
        double lowerThreshold = mean - (2 * standardDeviation);

        List<Long> filteredSpeeds = recentSpeeds.stream()
                .filter(speed -> speed >= lowerThreshold && speed <= upperThreshold)
                .toList();

        return filteredSpeeds.isEmpty()
                ? currentSpeed
                : (long) filteredSpeeds.stream()
                .mapToLong(Long::longValue)
                .average()
                .orElse(currentSpeed);
    }

    /**
     * Get average speed in bytes per second for last interval
     */
    public long getSpeed() {
        if (speedPoints.size() < 2) {
            return 0;
        }

        Map.Entry<Long, SpeedPoint> firstEntry = speedPoints.firstEntry();
        Map.Entry<Long, SpeedPoint> lastEntry = speedPoints.lastEntry();

        long timeDiff = lastEntry.getKey() - firstEntry.getKey();
        if (timeDiff <= 0) {
            return 0;
        }

        long bytesDownloaded = lastEntry.getValue().downloadedSize - firstEntry.getValue().downloadedSize;
        if (bytesDownloaded < 0) {
            bytesDownloaded = lastEntry.getValue().downloadedSize;
        }

        return (bytesDownloaded * 1000L) / timeDiff;
    }

    /**
     * Get median speed from all recorded points
     */
    public long getMedianSpeed() {
        if (speedPoints.size() < 2) {
            return 0;
        }

        List<Long> speeds = speedPoints.values().stream()
                .map(point -> point.speed)
                .filter(speed -> speed > 0)
                .sorted()
                .toList();

        if (speeds.isEmpty()) {
            return 0;
        }

        return speeds.get(speeds.size() / 2);
    }

    /**
     * Get maximum recorded speed
     */
    public long getMaxSpeed() {
        return speedPoints.values().stream()
                .map(point -> point.speed)
                .max(Long::compare)
                .orElse(0L);
    }

    /**
     * Get minimum recorded speed
     */
    public long getMinSpeed() {
        return speedPoints.values().stream()
                .map(point -> point.speed)
                .filter(speed -> speed > 0)
                .min(Long::compare)
                .orElse(0L);
    }

    /**
     * Get speed statistics summary
     */
    public SpeedStats getSpeedStats() {
        return new SpeedStats(
                interval,
                getSpeed(),
                getMedianSpeed(),
                getMaxSpeed(),
                getMinSpeed()
        );
    }

    public record SpeedStats(int interval, long avgSpeed, long medianSpeed, long maxSpeed, long minSpeed) {
    }
}
