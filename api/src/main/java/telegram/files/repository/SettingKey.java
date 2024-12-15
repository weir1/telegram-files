package telegram.files.repository;

import cn.hutool.core.convert.Convert;
import io.vertx.core.json.JsonObject;

import java.util.function.Function;

public enum SettingKey {
    uniqueOnly(Convert::toBool),
    needToLoadImages(Convert::toBool),
    imageLoadSize,
    showSensitiveContent(Convert::toBool),
    autoDownload(value -> new JsonObject(value).mapTo(SettingAutoRecords.class)),
    /**
     * Auto download limit for each telegram account
     */
    autoDownloadLimit(Convert::toInt),
    ;

    public final Function<String, ?> converter;

    SettingKey() {
        this.converter = Function.identity();
    }

    SettingKey(Function<String, ?> converter) {
        this.converter = converter;
    }
}
