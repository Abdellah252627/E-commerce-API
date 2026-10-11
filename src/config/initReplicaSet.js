import mongoose from 'mongoose';

const initReplicaSet = async () => {
  try {
    // Check if already a replica set
    const status = await mongoose.connection.db.admin().command({ replSetGetStatus: 1 });
    console.log('Replica set already configured');
    return;
  } catch (e) {
    // Not a replica set yet
    console.log('Replica set not configured, attempting to initiate...');
    try {
      const result = await mongoose.connection.db.admin().command({
        replSetInitiate: {
          _id: 'rs0',
          members: [{ _id: 0, host: '127.0.0.1:27017' }],
        },
      });
      console.log('Replica set initiated:', JSON.stringify(result));
      // Wait for primary
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          const res = await mongoose.connection.db.admin().command({ isMaster: 1 });
          if (res.ismaster) {
            console.log('Replica set is now primary');
            return;
          }
        } catch {}
      }
      console.log('Replica set initiated, waiting for primary to be ready...');
    } catch (err) {
      console.error('Failed to initiate replica set:', err.message);
    }
  }
};

export default initReplicaSet;