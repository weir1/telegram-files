package telegram.files;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AvgSpeedTest {
    private AvgSpeed avgSpeed;

    private static final int TEST_INTERVAL = 100; // 100 seconds for testing

    private static final int SMOOTHING_WINDOW = 3;

    @BeforeEach
    void setUp() {
        avgSpeed = new AvgSpeed(TEST_INTERVAL, SMOOTHING_WINDOW);
    }

    @Test
    void testInitialState() {
        assertEquals(0, avgSpeed.getSpeed());
        assertEquals(0, avgSpeed.getMedianSpeed());
        assertEquals(0, avgSpeed.getMaxSpeed());
        assertEquals(0, avgSpeed.getMinSpeed());
    }

    @Test
    void testConstantSpeed() {
        // Simulate constant download speed of 100 bytes per second
        long baseTime = System.currentTimeMillis();
        long totalSize = 1000;

        avgSpeed.update(totalSize, 0L, baseTime);
        avgSpeed.update(totalSize, 1000L, baseTime + 10000); // 100 bytes/sec for 10 seconds
        avgSpeed.update(totalSize, 2000L, baseTime + 20000); // 100 bytes/sec for another 10 seconds

        AvgSpeed.SpeedStats stats = avgSpeed.getSpeedStats();
        assertEquals(100, stats.avgSpeed(), 1.0, "Average speed should be 100 bytes/sec");
    }

    @Test
    void testSpeedWithPause() {
        long baseTime = System.currentTimeMillis();
        long totalSize = 1000;

        // Download at 100 bytes/sec
        avgSpeed.update(totalSize, 0L, baseTime);
        avgSpeed.update(totalSize, 1000L, baseTime + 10000); // 100 bytes/sec

        // Pause for 10 seconds
        avgSpeed.update(totalSize, 1000L, baseTime + 20000);

        // Resume at 100 bytes/sec
        avgSpeed.update(totalSize, 2000L, baseTime + 30000);

        // Average speed should be: 2000 bytes / 30 seconds = 66.67 bytes/sec
        assertEquals(67, avgSpeed.getSpeed(), 1.0,
                "Speed should account for pause period");
    }

    @Test
    void testDownloadRestart() {
        long baseTime = System.currentTimeMillis();
        long totalSize = 1000;

        // Initial download
        avgSpeed.update(totalSize, 0L, baseTime);
        avgSpeed.update(totalSize, 1000L, baseTime + 10000); // 100 bytes/sec

        // Restart download
        avgSpeed.update(totalSize, 0L, baseTime + 15000);
        avgSpeed.update(totalSize, 500L, baseTime + 20000); // 100 bytes/sec after restart

        AvgSpeed.SpeedStats stats = avgSpeed.getSpeedStats();
        assertTrue(stats.maxSpeed() >= 100,
                "Max speed should capture the highest speed segment");
    }

    @Test
    void testSpeedFluctuation() {
        long baseTime = System.currentTimeMillis();
        long totalSize = 1000;

        avgSpeed.update(totalSize, 0L, baseTime);
        avgSpeed.update(totalSize, 500L, baseTime + 5000);    // 100 bytes/sec
        avgSpeed.update(totalSize, 2500L, baseTime + 10000);  // 400 bytes/sec
        avgSpeed.update(totalSize, 3000L, baseTime + 15000);  // 100 bytes/sec

        AvgSpeed.SpeedStats stats = avgSpeed.getSpeedStats();
        assertTrue(stats.maxSpeed() >= 300,
                "Max speed should capture high speed period");
        assertTrue(stats.minSpeed() <= 100,
                "Min speed should capture low speed period");
    }

    @Test
    void testDataSmoothing() {
        long baseTime = System.currentTimeMillis();
        long totalSize = 1000;

        avgSpeed.update(totalSize, 0L, baseTime);
        avgSpeed.update(totalSize, 1000L, baseTime + 10000);   // 100 bytes/sec
        avgSpeed.update(totalSize, 2000L, baseTime + 20000);   // 100 bytes/sec
        avgSpeed.update(totalSize, 7000L, baseTime + 30000);   // 500 bytes/sec (spike)
        avgSpeed.update(totalSize, 8000L, baseTime + 40000);   // 100 bytes/sec

        AvgSpeed.SpeedStats stats = avgSpeed.getSpeedStats();
        assertTrue(stats.avgSpeed() < 300,
                "Smoothed speed should be less than the spike value");
    }

    @Test
    void testOldDataRemoval() {
        long baseTime = System.currentTimeMillis();
        long totalSize = 1000;

        // Add initial points
        avgSpeed.update(totalSize, 0L, baseTime);
        avgSpeed.update(totalSize, 1000L, baseTime + 10000); // 100 bytes/sec

        // Add point beyond interval
        // Note: Need to move forward by interval milliseconds plus a buffer
        avgSpeed.update(totalSize, 2000L, baseTime + (TEST_INTERVAL * 1000L) + 20000);

        long speed = avgSpeed.getSpeed();
        assertTrue(speed < 50,
                "Speed should be very low when most points are outside the interval");
    }

    @Test
    void testMedianCalculation() {
        long baseTime = System.currentTimeMillis();
        long totalSize = 1000;

        // Create a sequence of very distinct speeds for clear median
        avgSpeed.update(totalSize, 0L, baseTime);
        avgSpeed.update(totalSize, 1000L, baseTime + 5000);   // 200 bytes/sec
        avgSpeed.update(totalSize, 1500L, baseTime + 10000);  // 100 bytes/sec
        avgSpeed.update(totalSize, 3500L, baseTime + 15000);  // 400 bytes/sec

        long medianSpeed = avgSpeed.getMedianSpeed();
        assertTrue(medianSpeed >= 100 && medianSpeed <= 400,
                "Median speed should be between the lowest and highest speeds");
    }

    @Test
    void testExtremeCases() {
        long baseTime = System.currentTimeMillis();

        // Test with zero time difference
        avgSpeed.update(1000L, 0L, baseTime);
        avgSpeed.update(1000L, 100L, baseTime);
        assertEquals(0, avgSpeed.getSpeed(),
                "Speed should be 0 when time difference is 0");

        // Test with large downloads
        avgSpeed.update(1000000L, 0L, baseTime + 1000);
        avgSpeed.update(1000000L, 500000L, baseTime + 6000); // 100,000 bytes/sec
        assertTrue(avgSpeed.getSpeed() > 0,
                "Speed should be calculated correctly with large numbers");
    }
}
