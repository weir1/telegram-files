package telegram.files.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class SettingAutoRecords {

    public List<Item> items;

    public static class Item {
        public long telegramId;

        public long chatId;

        public String nextFileType;

        public long nextFromMessageId;

        public Item() {
        }

        public Item(long telegramId, long chatId) {
            this.telegramId = telegramId;
            this.chatId = chatId;
        }

        public String uniqueKey() {
            return telegramId + ":" + chatId;
        }
    }

    public SettingAutoRecords() {
        this.items = new ArrayList<>();
    }

    public SettingAutoRecords(List<Item> items) {
        this.items = items;
    }

    public boolean exists(long telegramId, long chatId) {
        return items.stream().anyMatch(item -> item.telegramId == telegramId && item.chatId == chatId);
    }

    public void add(Item item) {
        items.removeIf(i -> i.telegramId == item.telegramId && i.chatId == item.chatId);
        items.add(item);
    }

    public void add(long telegramId, long chatId) {
        items.add(new Item(telegramId, chatId));
    }

    public void remove(long telegramId, long chatId) {
        items.removeIf(item -> item.telegramId == telegramId && item.chatId == chatId);
    }

    public Set<Long> getChatIds(long telegramId) {
        return items.stream()
                .filter(item -> item.telegramId == telegramId)
                .map(item -> item.chatId)
                .collect(Collectors.toSet());
    }

}
