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
          >
          <span :class="{ completed: item.completed }">{{ item.text }}</span>
          <small v-if="item.completedAt" class="timestamp-item">Завершено: {{ item.completedAt }}</small>
        </li>
      </ul>
      <p v-if="card.completedAt" class="timestamp-card"><strong>Карточка завершена:</strong> {{ card.completedAt }}</p>
    </div>
  `,
    methods: {
        handleCheckboxChange(item) {
            const now = new Date().toLocaleString(); // Генерируем текущий таймстамп

            // Обновляем состояние элемента в зависимости от текущего состояния чекбокса
            if (item.completed) {
                // Если элемент был выполнен и пользователь снимает галочку
                this.$set(item, 'completed', false);
                this.$set(item, 'completedAt', null); // Сбрасываем таймстамп
            } else {
                // Если элемент был не выполнен и пользователь ставит галочку
                this.$set(item, 'completed', true);
                this.$set(item, 'completedAt', now); // Устанавливаем новый таймстамп
            }

            this.$emit('update'); // Оповещаем родительский компонент о изменениях
        }
    }
});
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
            this.columns = JSON.parse(savedData); // Восстанавливаем данные
        }
    },
    methods: {
        openForm(columnId) {
            this.formColumnId = columnId;
            this.newCardTitle = '';
            this.newCardItems = ['', '', ''];
        },
        closeForm() {
            this.formColumnId = null;
        },
        addItem() {
            this.newCardItems.push('');
        },
        removeItem(index) {
            this.newCardItems.splice(index, 1);
        },
        submitForm() {
            const column = this.columns.find(col => col.id === this.formColumnId);
            if (this.newCardTitle && this.newCardItems.every(item => item.trim())) {
                column.cards.push({
                    id: Date.now(),
                    title: this.newCardTitle,
                    items: this.newCardItems.map(text => ({ text, completed: false, completedAt: null })),
                    completedAt: null // Дата завершения карточки
                });
                this.saveData();
                this.closeForm();
            } else {
                alert('Заполните все поля!');
            }
        },
        updateCard() {
            this.columns.forEach(column => {
                column.cards.forEach(card => {
                    const completedCount = card.items.filter(item => item.completed).length;
                    const totalItems = card.items.length;
                    const completionPercentage = (completedCount / totalItems) * 100;

                    // Перемещаем карточку во второй столбец, если выполнено более 50%
                    if (completionPercentage > 50 && column.id === 1) {
                        this.moveCard(card, 1, 2);
                    }

                    // Завершаем карточку, если выполнено 100%
                    if (completionPercentage === 100) {
                        card.completedAt = new Date().toLocaleString(); // Устанавливаем дату завершения карточки
                        this.moveCard(card, column.id, 3);
                    }
                });
            });
            this.saveData();
        },
        moveCard(card, fromColumnId, toColumnId) {
            const fromColumn = this.columns.find(col => col.id === fromColumnId);
            const toColumn = this.columns.find(col => col.id === toColumnId);
            const cardIndex = fromColumn.cards.indexOf(card);

            if (toColumn.cards.length < (toColumnId === 2 ? 5 : Infinity)) {
                toColumn.cards.push(card);
                fromColumn.cards.splice(cardIndex, 1);
            }
        },
        saveData() {
            localStorage.setItem('noteAppData', JSON.stringify(this.columns));
        },
        isColumnBlocked(columnId) {
            if (columnId === 1) {
                const secondColumnFull = this.columns[1].cards.length >= 5;
                const firstColumnOver50 = this.columns[0].cards.some(card => {
                    const completedCount = card.items.filter(item => item.completed).length;
                    return (completedCount / card.items.length) * 100 > 50;
                });
                return secondColumnFull && firstColumnOver50;
            }
            return false;
        }
    }
});