package telegram.files;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.log.Log;
import cn.hutool.log.LogFactory;
import io.vertx.core.Future;
import telegram.files.repository.SettingAutoRecords;
import telegram.files.repository.SettingKey;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

public class AutoRecordsHolder {
    private final Log log = LogFactory.get();

    private final SettingAutoRecords autoRecords = new SettingAutoRecords();

    private final List<Consumer<List<SettingAutoRecords.Item>>> onRemoveListeners = new ArrayList<>();

    public AutoRecordsHolder() {
    }

    public SettingAutoRecords autoRecords() {
        return autoRecords;
    }

    public void registerOnRemoveListener(Consumer<List<SettingAutoRecords.Item>> onRemove) {
        onRemoveListeners.add(onRemove);
    }

    public Future<Void> init() {
        return DataVerticle.settingRepository.<SettingAutoRecords>getByKey(SettingKey.autoDownload)
                .onSuccess(settingAutoRecords -> {
                    if (settingAutoRecords == null) {
                        return;
                    }
                    settingAutoRecords.items.forEach(item -> HttpVerticle.getTelegramVerticle(item.telegramId)
                            .ifPresentOrElse(telegramVerticle -> {
                                if (telegramVerticle.authorized) {
                                    autoRecords.add(item);
                                } else {
                                    log.warn("Init auto records fail. Telegram verticle not authorized: %s".formatted(item.telegramId));
                                }
                            }, () -> log.warn("Init auto records fail. Telegram verticle not found: %s".formatted(item.telegramId))));
                })
                .onFailure(e -> log.error("Init auto records failed!", e))
                .mapEmpty();
    }

    public void onAutoRecordsUpdate(SettingAutoRecords records) {
        for (SettingAutoRecords.Item item : records.items) {
            if (!autoRecords.exists(item.telegramId, item.chatId)) {
                // new enabled
                HttpVerticle.getTelegramVerticle(item.telegramId)
                        .ifPresentOrElse(telegramVerticle -> {
                            if (telegramVerticle.authorized) {
                                autoRecords.add(item);
                                log.info("Add auto records success: %s".formatted(item.uniqueKey()));
                            } else {
                                log.warn("Add auto records fail. Telegram verticle not authorized: %s".formatted(item.telegramId));
                            }
                        }, () -> log.warn("Add auto records fail. Telegram verticle not found: %s".formatted(item.telegramId)));
            }
        }
        // remove disabled
        List<SettingAutoRecords.Item> removedItems = new ArrayList<>();
        autoRecords.items.removeIf(item -> {
            if (records.exists(item.telegramId, item.chatId)) {
                return false;
            }
            removedItems.add(item);
            log.info("Remove auto records success: %s".formatted(item.uniqueKey()));
            return true;
        });
        if (CollUtil.isNotEmpty(removedItems)) {
            onRemoveListeners.forEach(listener -> listener.accept(removedItems));
        }
    }
}
