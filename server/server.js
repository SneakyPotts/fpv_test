const WebSocket = require('ws');
const url = require('url');

// Створюємо сервер WebSocket
const wss = new WebSocket.Server({ port: 8080 });

// Валідні ключі для авторизації
const validApiKeys = ['key1', 'key2', 'key3']; // Ви можете додати більше або змінити ці ключі

// Визначаємо межі для території України
const LATITUDE_MIN = 44.38;
const LATITUDE_MAX = 52.38;
const LONGITUDE_MIN = 22.14;
const LONGITUDE_MAX = 40.23;

// Функція для створення випадкових координат в межах України
function getRandomCoordinate(min, max) {
	return (Math.random() * (max - min) + min).toFixed(6);
}

// Функція для створення нових цілей
function createTargets() {
	return [
		{ id: 1, name: "Target 1", latitude: getRandomCoordinate(LATITUDE_MIN, LATITUDE_MAX), longitude: getRandomCoordinate(LONGITUDE_MIN, LONGITUDE_MAX) },
		{ id: 2, name: "Target 2", latitude: getRandomCoordinate(LATITUDE_MIN, LATITUDE_MAX), longitude: getRandomCoordinate(LONGITUDE_MIN, LONGITUDE_MAX) },
		{ id: 3, name: "Target 3", latitude: getRandomCoordinate(LATITUDE_MIN, LATITUDE_MAX), longitude: getRandomCoordinate(LONGITUDE_MIN, LONGITUDE_MAX) },
		{ id: 4, name: "Target 4", latitude: getRandomCoordinate(LATITUDE_MIN, LATITUDE_MAX), longitude: getRandomCoordinate(LONGITUDE_MIN, LONGITUDE_MAX) },
		{ id: 5, name: "Target 5", latitude: getRandomCoordinate(LATITUDE_MIN, LATITUDE_MAX), longitude: getRandomCoordinate(LONGITUDE_MIN, LONGITUDE_MAX) },
	];
}

// Створюємо цілі
let targets = createTargets();

// Функція для видалення об'єктів
function scheduleTargetRemoval() {
	// Видаляємо першу ціль через 10 секунд
	setTimeout(() => {
		if (targets.length > 0) {
			console.log('Втрата зв\'язку з Target 1');
			targets = targets.filter(target => target.id !== 1);
		}
	}, 10000);

	// Видаляємо другу ціль через 20 секунд
	setTimeout(() => {
		if (targets.length > 0) {
			console.log('Втрата зв\'язку з Target 2');
			targets = targets.filter(target => target.id !== 2);
		}
	}, 20000);
}

// Функція для оновлення координат цілі в межах України з більшою швидкістю
function updateTargetPosition(target) {
	// Збільшуємо зміни до координат для підвищення швидкості
	let newLatitude = parseFloat(target.latitude) + (Math.random() - 0.5) * 0.1; // Збільшено крок зміни до 0.1
	let newLongitude = parseFloat(target.longitude) + (Math.random() - 0.5) * 0.1; // Збільшено крок зміни до 0.1

	// Якщо ціль виходить за межі України, коригуємо координати
	if (newLatitude < LATITUDE_MIN) newLatitude = LATITUDE_MIN;
	if (newLatitude > LATITUDE_MAX) newLatitude = LATITUDE_MAX;
	if (newLongitude < LONGITUDE_MIN) newLongitude = LONGITUDE_MIN;
	if (newLongitude > LONGITUDE_MAX) newLongitude = LONGITUDE_MAX;

	target.latitude = newLatitude.toFixed(6);
	target.longitude = newLongitude.toFixed(6);
}

// Відправляємо оновлення координат кожну секунду для плавного руху з підвищеною швидкістю
setInterval(() => {
	// Оновлюємо позиції цілей
	targets.forEach(target => {
		updateTargetPosition(target);
	});

	// Відправляємо дані всім підключеним клієнтам
	wss.clients.forEach(client => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(targets));
		}
	});

}, 1000); // Оновлюємо координати кожну секунду

// Імітація втрати зв'язку з певними цілями
setTimeout(() => {
	// Видаляємо першу ціль через 10 секунд
	targets.splice(0, 1); // Видаляємо Target 1
}, 10000);

setTimeout(() => {
	// Видаляємо другу ціль через 20 секунд
	targets.splice(1, 1); // Видаляємо Target 3 (яка зараз під індексом 1 після видалення першої)
}, 20000);

// Подія підключення нового клієнта
wss.on('connection', (ws, req) => {
	// Парсимо параметри запиту для отримання ключа
	const parameters = url.parse(req.url, true);
	const apiKey = parameters.query.apiKey;

	// Перевірка, чи є ключ валідним
	if (!validApiKeys.includes(apiKey)) {
		console.log('Невірний ключ API. З\'єднання закрито.');
		ws.close();
		return;
	}

	console.log('Клієнт підключився з валідним ключем API.');

	// При успішному підключенні новий користувач перезапускає всі цілі
	targets = createTargets();

	// Знову запланувати видалення об'єктів після перезапуску
	scheduleTargetRemoval();

	// Відправляємо стартові координати при підключенні
	ws.send(JSON.stringify(targets));

	// Подія при отриманні повідомлення від клієнта
	ws.on('message', (message) => {
		console.log(`Отримано повідомлення: ${message}`);
	});

	// Подія відключення клієнта
	ws.on('close', () => {
		console.log('Клієнт відключився');
	});
});

console.log('Сервер WebSocket запущено на порту 8080');
