package telegram.files;

import cn.hutool.core.convert.Convert;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.StrUtil;

import java.io.File;
import java.util.logging.Level;
import java.util.logging.Logger;

public class Config {
    public static final String LOG_LEVEL = StrUtil.blankToDefault(System.getenv("LOG_LEVEL"), "INFO");

    public static final String APP_ENV = StrUtil.blankToDefault(System.getenv("APP_ENV"), "prod");

    public static final String APP_ROOT = System.getenv("APP_ROOT");

    public static final String TELEGRAM_ROOT = APP_ROOT + File.separator + "account";

    public static final int TELEGRAM_API_ID = Convert.toInt(System.getenv("TELEGRAM_API_ID"), 0);

    public static final String TELEGRAM_API_HASH = System.getenv("TELEGRAM_API_HASH");

    public static final int TELEGRAM_LOG_LEVEL = Convert.toInt(System.getenv("TELEGRAM_LOG_LEVEL"), 0);

    private static Level logLevel;

    static {
        if (APP_ENV == null) {
            throw new RuntimeException("APP_ENV is not set");
        }
        if (APP_ROOT == null) {
            throw new RuntimeException("APP_ROOT is not set");
        }
        if (TELEGRAM_API_ID == 0) {
            throw new RuntimeException("TELEGRAM_API_ID is not set");
        }
        if (TELEGRAM_API_HASH == null) {
            throw new RuntimeException("TELEGRAM_API_HASH is not set");
        }

        try {
            logLevel = Level.parse(Config.LOG_LEVEL);
            System.out.println("Setting telegram.files log level to " + logLevel);
        } catch (IllegalArgumentException e) {
            System.err.println("Invalid log level [" + Config.LOG_LEVEL + "], using default INFO.");
        }

        Logger.getLogger("telegram.files").setLevel(logLevel);

        if (!FileUtil.exist(APP_ROOT)) {
            FileUtil.mkdir(APP_ROOT);
        }
        if (!FileUtil.exist(TELEGRAM_ROOT)) {
            FileUtil.mkdir(TELEGRAM_ROOT);
        }
    }

    public static boolean isProd() {
        return "prod".equals(APP_ENV);
    }
}
