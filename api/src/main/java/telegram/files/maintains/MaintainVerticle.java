package telegram.files.maintains;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.json.JsonObject;
import telegram.files.EventEnum;

public class MaintainVerticle extends AbstractVerticle {

    public void end(boolean success, Throwable cause) {
        vertx.eventBus().publish(EventEnum.MAINTAIN.address(),
                JsonObject.of("success", success, "message", cause == null ? null : cause.getMessage())
        );
    }
}
