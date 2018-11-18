import { List, ListItem, ListItemText, TextField } from '@material-ui/core';
import arrayDiffItems from 'array-diff-items'
import React, { ReactNode, useState } from 'react'
import { compareTwoStrings } from 'string-similarity'
import { diff_match_patch } from 'diff-match-patch';

const bgAlpha = '0.4';

const addedTextColor = '#080';
const addedBackgroundColor = `rgba(220, 255, 220, ${bgAlpha})`;
const AddedInline = (props: { children: ReactNode }) => (
  <span style={{ color: addedTextColor, backgroundColor: addedBackgroundColor }}>
    {props.children}
  </span>
);

const Added = (props: { item: string }) => (
  <div style={{backgroundColor: addedBackgroundColor}}>
    <ListItem>
      <ListItemText primary={props.item}/>
    </ListItem>
  </div>
);

const removedTextColor = '#800';
const removedBackgroundColor = `rgba(255, 220, 220, ${bgAlpha})`;
const RemovedInline = (props: { children: ReactNode }) => (
  <span style={{ color: removedTextColor, backgroundColor: removedBackgroundColor }}>
    {props.children}
  </span>
);

const Removed = (props: { item: string }) => (
  <div style={{backgroundColor: removedBackgroundColor}}>
    <ListItem>
      <ListItemText primary={props.item}/>
    </ListItem>
  </div>
);

const Unchanged = (props: { item: string }) => (
  <ListItem>
    <ListItemText primary={props.item}/>
  </ListItem>
);

const changedBackgroundColor = `rgba(255, 255, 220, ${bgAlpha})`;
const dmp = new diff_match_patch();
const Changed = (props: { left: string, right: string }) => {
  const diff = dmp.diff_main(props.left, props.right);
  dmp.diff_cleanupEfficiency(diff);
  return (
    <div style={{backgroundColor: changedBackgroundColor}}>
      <ListItem>
        <ListItemText primary={diff.map(([type, text], i) => (
          (type === 0)
            ? <span key={i}>{text}</span>
            : (
              (type < 0)
                ? <RemovedInline key={i}>{text}</RemovedInline>
                : <AddedInline key={i}>{text}</AddedInline>
            )
        ))}/>
      </ListItem>
    </div>
  );
};

type Props = {
  left: string[]
  right: string[]
}

export default ({ left, right }: Props) => {
  const [coefficient, setCoefficient] = useState(2);

  const diffItems = arrayDiffItems(left, right)((a, b) => (1 - compareTwoStrings(a, b)) * coefficient);

  return (
    <>
      <TextField
        value={coefficient}
        label="coefficient"
        type="number"
        onChange={e => setCoefficient(parseFloat(e.target.value))}
        fullWidth
        inputProps={{
          min: '0.5',
          max: '10.0',
          step: '0.5',
        }}
      />
      <List>
        {diffItems.map((diffItem, index) => {
          switch (diffItem.type) {
            case 'Added': return <Added key={index} item={diffItem.item}/>;
            case 'Removed': return <Removed key={index} item={diffItem.item}/>;
            case 'Changed': return <Changed key={index} left={diffItem.left} right={diffItem.right} />;
            case 'Unchanged': return <Unchanged key={index} item={diffItem.item}/>;
          }
        })}
      </List>
    </>
  );
};