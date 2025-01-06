package telegram.files;

import java.time.LocalDateTime;

public class MessyUtils {

    public static LocalDateTime withGrouping5Minutes(LocalDateTime time) {
        int minute = time.getMinute();
        int minuteGroup = minute / 5;
        int newMinute = minuteGroup * 5;
        return time.withMinute(newMinute).withSecond(0).withNano(0);
    }
}
