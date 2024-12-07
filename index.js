import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from './db.js';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html'));
});

// ¿Cuantos jugadores se unieron en el ultimo mes?

app.get('/consulta/jugadores-recientes', async (req, res) => {
  try {
    const result = await sql`
      SELECT COUNT(*) AS jugadores_recientes
      FROM Usuario
      WHERE rol = 'jugador' AND fecha_reg >= CURRENT_DATE - INTERVAL '1 month';
    `;
    res.send(`Cantidad de jugadores recientes: ${result[0].jugadores_recientes}`);
  } catch (error) {
    console.error('Error en /consulta/jugadores-recientes:', error);
    res.status(500).send('Error al obtener los datos');
  }
});

// ¿Cual es el jugador con la mejor relacion K/D en un torneo especifico?

app.get('/consulta/kd-torneo', async (req, res) => {
  try {
    const torneoId = req.query.torneoId;
    console.log('Recibiendo torneoId:', torneoId);
    if (!torneoId) {
      return res.status(400).send('El parametro "torneoId" es requerido.');
    }

    const result = await sql`
      SELECT j.nombre AS jugador, t.nombre AS torneo, 
      SUM(e.kills)::FLOAT / NULLIF(SUM(e.deaths), 0) AS kd_ratio
      FROM Estadistica e
      JOIN Jugador j ON e.id_jugador = j.id_jugador
      JOIN Partida p ON e.id_partida = p.id_partida
      JOIN Torneo t ON p.id_torneo = t.id_torneo
      WHERE t.id_torneo = ${torneoId}
      GROUP BY j.nombre, t.nombre
      ORDER BY kd_ratio DESC
      LIMIT 1;
    `;
    console.log('Resultado de la consulta K/D:', result);
    if (result.length === 0) {
      return res.send('No se encontraron jugadores para el torneo especificado.');
    }

    const jugador = result[0];
    res.send(
      `El jugador con la mejor relacion K/D en el torneo ${jugador.torneo} es ${jugador.jugador}, con una relacion K/D de ${jugador.kd_ratio.toFixed(2)}`
    );
  } catch (error) {
    console.error('Error en /consulta/kd-torneo:', error);
    res.status(500).send('Error al obtener los datos');
  }
});

// ¿Cuantos jugadores hay en un equipo especifico?

app.get('/consulta/jugadores-equipo', async (req, res) => {
  try {
    const equipoId = req.query.equipoId;
    console.log('Recibiendo equipoId:', equipoId);
    if (!equipoId) {
      return res.status(400).send('El parametro "equipoId" es requerido.');
    }

    const result = await sql`
      SELECT COUNT(*) AS cantidad_jugadores
      FROM Jugador
      WHERE id_equipo = ${equipoId};
    `;
    console.log('Resultado de la consulta jugadores-equipo:', result);
    if (result.length === 0) {
      return res.send('No se encontraron jugadores para el equipo especificado.');
    }

    res.send(`El equipo con ID ${equipoId} tiene ${result[0].cantidad_jugadores} jugadores.`);
  } catch (error) {
    console.error('Error en /consulta/jugadores-equipo:', error);
    res.status(500).send('Error al obtener los datos');
  }
});

// ¿Cual es el equipo con mas logros?

app.get('/consulta/equipo-mas-logros', async (req, res) => {
  try {
    console.log('Consulta: Equipo con mas logros');

    const result = await sql`
      SELECT nombre, logros
      FROM Equipo
      ORDER BY logros DESC
      LIMIT 1;
    `;

    console.log('Resultado de la consulta equipo-mas-logros:', result);

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron equipos.' });
    }

    const equipo = result[0];
    res.json(equipo);
  } catch (error) {
    console.error('Error en /consulta/equipo-mas-logros:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});

// ¿Cual es el porcentaje de victorias de los equipos en los ultimos 10 torneos?

app.get('/consulta/porcentaje-victorias', async (req, res) => {
  try {
    console.log('Consulta: Porcentaje de victorias en los ultimos 10 torneos');
    const result = await sql`
      SELECT eq.nombre AS equipo, 
             COUNT(t.id_torneo)::FLOAT / 10 * 100 AS porcentaje_victorias
      FROM Torneo t
      JOIN Equipo eq ON t.id_equipo_ganador = eq.id_equipo
      WHERE t.fecha_fin IS NOT NULL
      GROUP BY eq.nombre
      ORDER BY porcentaje_victorias DESC
      LIMIT 10;
    `;

    console.log('Resultado de la consulta porcentaje-victorias:', result);

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron equipos con victorias.' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error en /consulta/porcentaje-victorias:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});


// ¿Cual es el porcentaje de victorias de los equipos en los ultimos 10 torneos?

app.get('/consulta/porcentaje-victorias', async (req, res) => {
  try {
    console.log('Consulta: Porcentaje de victorias en los ultimos 10 torneos');

    const result = await sql`
      SELECT eq.nombre AS equipo, 
             COUNT(t.id_torneo)::FLOAT / 10 * 100 AS porcentaje_victorias
      FROM Torneo t
      JOIN Equipo eq ON t.id_equipo_ganador = eq.id_equipo
      WHERE t.fecha_fin IS NOT NULL
      GROUP BY eq.nombre
      ORDER BY porcentaje_victorias DESC
      LIMIT 10;
    `;

    console.log('Resultado de la consulta porcentaje-victorias:', result);

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron equipos con victorias.' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error en /consulta/porcentaje-victorias:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});

// ¿Cuantos torneos ha ganado cada equipo?

app.get('/consulta/torneos-ganados', async (req, res) => {
  try {
    const result = await sql`
      SELECT eq.nombre AS equipo, 
             COALESCE(COUNT(t.id_torneo), 0) AS torneos_ganados
      FROM Equipo eq
      LEFT JOIN Torneo t ON t.id_equipo_ganador = eq.id_equipo
      GROUP BY eq.nombre
      ORDER BY torneos_ganados DESC;
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron equipos con torneos ganados.' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error en /consulta/torneos-ganados:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});


// ¿Que equipo tiene el mayor numero de miembros?

app.get('/consulta/equipo-mas-miembros', async (req, res) => {
  try {
    console.log('Consulta: Equipo con mas miembros');

    const result = await sql`
      SELECT eq.nombre AS equipo, COUNT(j.id_jugador) AS numero_miembros
      FROM Equipo eq
      JOIN Jugador j ON eq.id_equipo = j.id_equipo
      GROUP BY eq.nombre
      ORDER BY numero_miembros DESC
      LIMIT 1;
    `;

    console.log('Resultado de la consulta equipo-mas-miembros:', result);

    if (result.length === 0) {
      return res.status(404).json({ message: 'No se encontraron equipos.' });
    }

    const equipo = result[0];
    res.json(equipo);
  } catch (error) {
    console.error('Error en /consulta/equipo-mas-miembros:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});

// ¿Cuantos torneos ha ganado cada equipo?

app.get('/consulta/torneos-ganados', async (req, res) => {
  try {
    const result = await sql`
      SELECT eq.nombre AS equipo, COUNT(t.id_torneo) AS torneos_ganados
      FROM Torneo t
      JOIN Equipo eq ON t.id_equipo_ganador = eq.id_equipo
      GROUP BY eq.nombre
      ORDER BY torneos_ganados DESC;
    `;
    
    res.json(result);
  } catch (error) {
    console.error('Error en /consulta/torneos-ganados:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});

// ¿Porcentaje de victorias en cada mapa por un equipo en un torneo?

app.get('/consulta/porcentaje-victorias-mapas', async (req, res) => {
  try {
    const equipoId = req.query.equipoId;
    const torneoId = req.query.torneoId;

    if (!equipoId || !torneoId) {
      return res.status(400).send('Parametros "equipoId" y "torneoId" son requeridos.');
    }

    const result = await sql`
      SELECT m.nombre AS mapa, 
             COUNT(p.id_partida)::FLOAT / 
             (SELECT COUNT(*) FROM Partida WHERE id_torneo = ${torneoId}) * 100 AS porcentaje_victorias
      FROM Partida p
      JOIN Mapa m ON p.id_mapa = m.id_mapa
      WHERE p.id_torneo = ${torneoId} AND p.id_equipo_ganador = ${equipoId}
      GROUP BY m.nombre
      ORDER BY porcentaje_victorias DESC;
    `;
    
    res.json(result);
  } catch (error) {
    console.error('Error en /consulta/porcentaje-victorias-mapas:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});

// ¿Que mapa fue mas usado en un torneo especifico?

app.get('/consulta/mapa-mas-usado', async (req, res) => {
  try {
    const torneoId = req.query.torneoId;

    if (!torneoId) {
      return res.status(400).send('El parametro "torneoId" es requerido.');
    }

    const result = await sql`
      SELECT m.nombre AS mapa, COUNT(p.id_partida) AS veces_usado
      FROM Partida p
      JOIN Mapa m ON p.id_mapa = m.id_mapa
      WHERE p.id_torneo = ${torneoId}
      GROUP BY m.nombre
      ORDER BY veces_usado DESC
      LIMIT 1;
    `;
    
    res.json(result);
  } catch (error) {
    console.error('Error en /consulta/mapa-mas-usado:', error);
    res.status(500).json({ message: 'Error al obtener los datos.' });
  }
});



app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});