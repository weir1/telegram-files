package telegram.files;

import io.vertx.core.Future;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import telegram.files.repository.SettingAutoRecords;
import telegram.files.repository.SettingKey;
import telegram.files.repository.SettingRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class AutoRecordsHolderTest {
    private AutoRecordsHolder autoRecordsHolder;

    private MockedStatic<HttpVerticle> httpVerticleMockedStatic;

    private SettingAutoRecords settingAutoRecords1;

    private SettingAutoRecords.Item item1;

    @BeforeEach
    public void setUp() {
        autoRecordsHolder = new AutoRecordsHolder();
        httpVerticleMockedStatic = mockStatic(HttpVerticle.class);

        // Prepare test data
        settingAutoRecords1 = new SettingAutoRecords();
        item1 = new SettingAutoRecords.Item();
        item1.telegramId = 123L;
        item1.chatId = 456L;
        settingAutoRecords1.items.add(item1);

        // Mock dependencies
        TelegramVerticle mockTelegramVerticle = mock(TelegramVerticle.class);
        mockTelegramVerticle.authorized = true;
        when(HttpVerticle.getTelegramVerticle(item1.telegramId))
                .thenReturn(Optional.of(mockTelegramVerticle));
    }

    @AfterEach
    public void tearDown() {
        httpVerticleMockedStatic.close();
    }

    @Test
    public void testInit_WhenSettingExists_AddsAuthorizedRecords() {
        DataVerticle.settingRepository = mock(SettingRepository.class);

        // Mock dependencies
        when(DataVerticle.settingRepository.<SettingAutoRecords>getByKey(SettingKey.autoDownload))
                .thenReturn(Future.succeededFuture(settingAutoRecords1));

        // Execute
        Future<Void> result = autoRecordsHolder.init();

        // Verify
        assertNotNull(result);
        assertTrue(autoRecordsHolder.autoRecords().exists(item1.telegramId, item1.chatId));
    }

    @Test
    public void testOnAutoRecordsUpdate_AddingNewRecords() {
        // Execute
        autoRecordsHolder.onAutoRecordsUpdate(settingAutoRecords1);

        // Verify
        assertTrue(autoRecordsHolder.autoRecords().exists(item1.telegramId, item1.chatId));
    }

    @Test
    public void testOnAutoRecordsUpdate_RemovingRecords() {
        autoRecordsHolder.onAutoRecordsUpdate(settingAutoRecords1);

        // Prepare new records with no items
        SettingAutoRecords newRecords = new SettingAutoRecords();

        // Mock listener
        Consumer<List<SettingAutoRecords.Item>> mockListener = mock(Consumer.class);
        autoRecordsHolder.registerOnRemoveListener(mockListener);

        // Execute
        autoRecordsHolder.onAutoRecordsUpdate(newRecords);

        // Verify
        assertFalse(autoRecordsHolder.autoRecords().exists(item1.telegramId, item1.chatId));
        verify(mockListener).accept(argThat(list ->
                list.size() == 1 &&
                list.getFirst().telegramId == item1.telegramId &&
                list.getFirst().chatId == item1.chatId
        ));
    }

    @Test
    public void testRegisterOnRemoveListener() {
        // Prepare test listener
        List<SettingAutoRecords.Item> receivedItems = new ArrayList<>();
        Consumer<List<SettingAutoRecords.Item>> listener = receivedItems::addAll;

        // Register listener
        autoRecordsHolder.registerOnRemoveListener(listener);

        // Prepare initial and new records
        autoRecordsHolder.onAutoRecordsUpdate(settingAutoRecords1);

        SettingAutoRecords newRecords = new SettingAutoRecords();

        // Execute
        autoRecordsHolder.onAutoRecordsUpdate(newRecords);

        // Verify
        assertFalse(receivedItems.isEmpty());
        assertEquals(1, receivedItems.size());
        assertEquals(item1.telegramId, receivedItems.getFirst().telegramId);
        assertEquals(item1.chatId, receivedItems.getFirst().chatId);
    }
}
