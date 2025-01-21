package telegram.files.repository;

import telegram.files.Transfer;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public class SettingAutoRecords {

    public List<Item> items;

    public static class Item {
        public long telegramId;

        public long chatId;

        public String nextFileType;

        public long nextFromMessageId;

        public Rule rule;

        public Item() {
        }

        public Item(long telegramId, long chatId, Rule rule) {
            this.telegramId = telegramId;
            this.chatId = chatId;
            this.rule = rule;
        }

        public String uniqueKey() {
            return telegramId + ":" + chatId;
        }
    }

    public static class Rule {
        public String query;

        public List<String> fileTypes;

        public TransferRule transferRule;

        public Rule() {
        }

        public Rule(String query, List<String> fileTypes, TransferRule transferRule) {
            this.query = query;
            this.fileTypes = fileTypes;
            this.transferRule = transferRule;
        }
    }

    public static class TransferRule {
        public boolean transferHistory;

        public String destination;

        public Transfer.TransferPolicy transferPolicy;

        public Transfer.DuplicationPolicy duplicationPolicy;

        public TransferRule() {
        }

        public TransferRule(boolean transferHistory,
                            String destination,
                            Transfer.TransferPolicy transferPolicy,
                            Transfer.DuplicationPolicy duplicationPolicy) {
            this.transferHistory = transferHistory;
            this.destination = destination;
            this.transferPolicy = transferPolicy;
            this.duplicationPolicy = duplicationPolicy;
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

    public void add(long telegramId, long chatId, Rule rule) {
        items.add(new Item(telegramId, chatId, rule));
    }

    public void remove(long telegramId, long chatId) {
        items.removeIf(item -> item.telegramId == telegramId && item.chatId == chatId);
    }

    public Map<Long, Item> getItems(long telegramId) {
        return items.stream()
                .filter(item -> item.telegramId == telegramId)
                .collect(Collectors.toMap(i -> i.chatId, Function.identity()));
    }

    public Item getItem(long telegramId, long chatId) {
        return items.stream()
                .filter(item -> item.telegramId == telegramId && item.chatId == chatId)
                .findFirst()
                .orElse(null);
    }

}
