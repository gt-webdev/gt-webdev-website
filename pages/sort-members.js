import React from 'react'
import Board from 'react-ui-kanban'

function SortMembersPage() {
    const [eventBus, setEventBus] = React.useState(undefined);

    const data = {
        lanes: [
          {
            id: 'lane1',
            title: 'Planned Tasks',
            label: '2/2',
            cards: [
              {id: 'Card1', title: 'Write Blog', description: 'Can AI make memes', label: '30 mins'},
              {id: 'Card2', title: 'Pay Rent', description: 'Transfer via NEFT', label: '5 mins', metadata: {sha: 'be312a1'}}
            ]
          },
          {
            id: 'lane2',
            title: 'Completed',
            label: '0/0',
            cards: []
          }
        ]
      };

    return (
        <div>
            <h1>Sort Members Page</h1>
            <button onClick={() => {
              if (eventBus) {
                // TODO: use a better thing for ID like database object ID
                const customId = new Date().getTime();
                eventBus.publish({type: 'ADD_CARD', laneId: 'lane1', card: {id: `Card${customId}`, title: 'Write Blog', description: 'Can AI make memes', label: '30 mins'}});
              }
            }}>Add Item</button>
            <Board data={data} eventBusHandle={setEventBus}/>
        </div>
    );
}

export default SortMembersPage;