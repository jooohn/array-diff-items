import { Delete } from '@material-ui/icons';
import React, { ChangeEvent, FormEvent, useState } from 'react';
import {
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@material-ui/core';

type Props = {
  names: string[]
  onAdd: () => void
  onChange: (params: { name: string, index: number }) => void
  onRemove: (index: number) => void
}

export default (props: Props) => {
  const { names, onAdd, onChange, onRemove } = props;

  const handleChange = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ name: e.target.value, index });
  };

  const handleRemove = (index: number) => () => {
    onRemove(index);
  };

  return (
    <div>
      <Button variant="outlined" fullWidth onClick={onAdd}>Add New Item</Button>
      <List>
        {names.map((name, index) => (
          <ListItem key={index}>
            <TextField
              label="Name"
              value={name}
              onChange={handleChange(index)}
              margin="normal"
            />
            <ListItemSecondaryAction>
              <IconButton onClick={handleRemove(index)}>
                <Delete/>
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

