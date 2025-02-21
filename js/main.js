Vue.component('card', {
    props: ['card'],
    template: `
    <div class="card">
      <h3>{{ card.title }}</h3>
      <ul>
        <li v-for="(item, index) in card.items" :key="index">
          <!-- Добавляем условие для установки значения только в true -->
          <input 
            type="checkbox" 
            :checked="item.completed" 
            @change="handleCheckboxChange(item)" 
            :disabled="item.completed" 
          >
          <span :class="{ completed: item.completed }">{{ item.text }}</span>
        </li>
      </ul>
      <p v-if="card.completedAt">Завершено: {{ card.completedAt }}</p>
    </div>
  `,
    methods: {
        handleCheckboxChange(item) {
            if (!item.completed) {
                this.$set(item, 'completed', true); // Устанавливаем только в true
                this.$emit('update'); // Оповещаем родительский компонент о изменениях
            }
        }
    }
});
// Экземпляр Vue
new Vue({
    el: '#app',
    data: {
        columns: [
            { id: 1, cards: [] },
            { id: 2, cards: [] },
            { id: 3, cards: [] }
        ],
        formColumnId: null,
        newCardTitle: '',
        newCardItems: ['', '', '']
    },
    created() {
        // При создании приложения загружаем сохраненные данные из localStorage
        const savedData = localStorage.getItem('noteAppData');
        if (savedData) {
            this.columns = JSON.parse(savedData);// Восстанавливаем данные
        }
    },
    methods: {
        openForm(columnId) {// Метод для открытия формы создания карточки
            this.formColumnId = columnId;
            this.newCardTitle = '';
            this.newCardItems = ['', '', ''];
        },
        closeForm() {// Метод для закрытия формы
            this.formColumnId = null;
        },
        addItem() {// Метод для добавления нового пункта в форму
            this.newCardItems.push('');
        },
        removeItem(index) {// Метод для удаления пункта из формы
            this.newCardItems.splice(index, 1);
        },
        submitForm() {// Метод для сохранения новой карточки
            const column = this.columns.find(col => col.id === this.formColumnId);
            if (this.newCardTitle && this.newCardItems.every(item => item.trim())) {// Проверяем, что все поля заполнены
                column.cards.push({
                    id: Date.now(),
                    title: this.newCardTitle,
                    items: this.newCardItems.map(text => ({ text, completed: false })),
                    completedAt: null// Дата завершения
                });
                this.saveData();// Сохраняем данные в localStorage
                this.closeForm();
            } else {
                alert('Заполните все поля!');
            }
        },
        updateCard() {// Метод для обновления состояния карточек
            this.columns.forEach(column => {// Перебираем все столбцы
                column.cards.forEach(card => {// Перебираем все карточки в столбце
                    const completedCount = card.items.filter(item => item.completed).length;// Кол-во выполненных пунктов
                    const totalItems = card.items.length;// Общее кол-во пунктов
                    const completionPercentage = (completedCount / totalItems) * 100;// Процент выполнения
                    if (completionPercentage > 50 && column.id === 1) {// Если выполнено более 50% и карточка в первом столбце
                        this.moveCard(card, 1, 2); // Перемещаем карточку во второй столбец
                    }
                    if (completionPercentage === 100) {// Если выполнено 100%
                        card.completedAt = new Date().toLocaleString();// Устанавливаем дату завершения
                        this.moveCard(card, column.id, 3);// Перемещаем карточку в третий столбец
                    }
                });
            });
            this.saveData();
        },
        moveCard(card, fromColumnId, toColumnId) {// Метод для перемещения карточки между столбцами
            const fromColumn = this.columns.find(col => col.id === fromColumnId);// Находим исходный столбец
            const toColumn = this.columns.find(col => col.id === toColumnId);// Находим нужный столбец
            const cardIndex = fromColumn.cards.indexOf(card);// Получаем индекс карточки в исходном столбце
            if (toColumn.cards.length < (toColumnId === 2 ? 5 : Infinity)) {// Проверяем ограничения на количество карточек
                toColumn.cards.push(card);// Добавляем карточку в нужный столбец
                fromColumn.cards.splice(cardIndex, 1);// Удаляем карточку из исходного столбца
            }
        },
        saveData() {// Метод для сохранения данных в localStorage
            localStorage.setItem('noteAppData', JSON.stringify(this.columns));
        },
        isColumnBlocked(columnId) {// Метод для проверки блокировки первого столбца
            if (columnId === 1) {
                const secondColumnFull = this.columns[1].cards.length >= 5;
                const firstColumnOver50 = this.columns[0].cards.some(card => {
                    const completedCount = card.items.filter(item => item.completed).length;
                    return (completedCount / card.items.length) * 100 > 50;
                });
                return secondColumnFull && firstColumnOver50;// Блокируем, если оба условия выполняются
            }
            return false;
        }
    }
});