package telegram.files;

import cn.hutool.core.util.StrUtil;
import cn.hutool.log.Log;
import cn.hutool.log.LogFactory;
import io.vertx.core.AbstractVerticle;
import io.vertx.core.Future;
import io.vertx.core.Promise;
import io.vertx.jdbcclient.JDBCConnectOptions;
import io.vertx.jdbcclient.JDBCPool;
import io.vertx.sqlclient.PoolOptions;
import telegram.files.repository.FileRepository;
import telegram.files.repository.SettingRepository;
import telegram.files.repository.TelegramRepository;
import telegram.files.repository.impl.FileRepositoryImpl;
import telegram.files.repository.impl.SettingRepositoryImpl;
import telegram.files.repository.impl.TelegramRepositoryImpl;

import java.io.File;
import java.util.List;

public class DataVerticle extends AbstractVerticle {

    private static final Log log = LogFactory.get();

    public static JDBCPool pool;

    public static FileRepository fileRepository;

    public static TelegramRepository telegramRepository;

    public static SettingRepository settingRepository;

    public void start(Promise<Void> stopPromise) {
        pool = JDBCPool.pool(vertx,
                new JDBCConnectOptions()
                        .setJdbcUrl("jdbc:sqlite:%s".formatted(getDataPath()))
                ,
                new PoolOptions().setMaxSize(16).setName("pool-tf")
        );
        telegramRepository = new TelegramRepositoryImpl(pool);
        fileRepository = new FileRepositoryImpl(pool);
        settingRepository = new SettingRepositoryImpl(pool);
        Future.all(List.of(
                        telegramRepository.init(),
                        fileRepository.init(),
                        settingRepository.init()
                ))
                .onSuccess(r -> {
                    log.info("Database initialized");
                    stopPromise.complete();
                })
                .onFailure(err -> {
                    log.error("Failed to initialize database: %s".formatted(err.getMessage()));
                    stopPromise.fail(err);
                });
    }

    @Override
    public void stop(Promise<Void> stopPromise) throws Exception {
        if (pool != null) {
            pool.close().onComplete(r -> {
                stopPromise.complete();
                if (r.succeeded()) {
                    log.debug("Data verticle stopped!");
                } else {
                    log.error("Failed to close data verticle: %s".formatted(r.cause().getMessage()));
                }
            });
        }
    }

    public static String getDataPath() {
        String dataPath = System.getenv("DATA_PATH");
        dataPath = StrUtil.blankToDefault(dataPath, "data.db");
        dataPath = Config.APP_ROOT + File.separator + dataPath;
        return dataPath;
    }
}
