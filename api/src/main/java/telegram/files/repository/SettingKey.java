package telegram.files.repository;

import cn.hutool.core.convert.Convert;
import io.vertx.core.json.JsonObject;

import java.util.function.Function;

public enum SettingKey {
    uniqueOnly(Convert::toBool, false),
    needToLoadImages(Convert::toBool, false),
    imageLoadSize,
    showSensitiveContent(Convert::toBool, false),
    autoDownload(value -> new JsonObject(value).mapTo(SettingAutoRecords.class)),
    /**
     * Auto download limit for each telegram account
     */
    autoDownloadLimit(Convert::toInt),
    ;

    public final Function<String, ?> converter;

    public final Object defaultValue;

    SettingKey() {
        this(Function.identity(), null);
    }

    SettingKey(Function<String, ?> converter) {
        this(converter, null);
    }

    SettingKey(Function<String, ?> converter, Object defaultValue) {
        this.converter = converter;
        this.defaultValue = defaultValue;
    }
}
