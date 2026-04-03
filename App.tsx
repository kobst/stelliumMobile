import React from 'react';
import Config from 'react-native-config';
import ClassicApp from './src/appEntrypoints/ClassicApp';
import RelationshipApp from './RelationshipApp/App';

const App: React.FC = () => {
  if (Config.APP_VARIANT === 'relationship') {
    return <RelationshipApp />;
  }

  return <ClassicApp />;
};

export default App;
