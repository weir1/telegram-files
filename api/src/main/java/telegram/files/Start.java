package telegram.files;

import cn.hutool.log.Log;
import cn.hutool.log.LogFactory;
import io.vertx.core.Vertx;

public class Start {
    private static final Log log = LogFactory.get();

    public static final String VERSION = "0.1.3";

    public static void main(String[] args) {
        Vertx vertx = Vertx.vertx();
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            vertx.close().onComplete(res -> {
                if (res.succeeded()) {
                    log.info("👋 Shutdown success");
                } else {
                    log.error("😱 Shutdown failed", res.cause());
                }
            });
        }));

        vertx.deployVerticle(new DataVerticle())
                .compose(id -> vertx.deployVerticle(new HttpVerticle()))
                .onSuccess(id -> log.info("🚀Start success"))
                .onFailure(err -> log.error("😱Start failed", err));
    }

}
