import { AppBar, Paper, Grid, Theme, Toolbar, Typography, withStyles, WithStyles } from '@material-ui/core';
import React, { Component } from 'react';
import './App.css';
import Form from './Form';
import Diff from './Diff';

const styles = (theme: Theme) => ({
  main: {
    marginTop: theme.spacing.unit * 2,
  },
  paper: {
    padding: theme.spacing.unit,
  }
});
type Props = WithStyles<typeof styles>
type State = {
  left: string[]
  right: string[]
}

type Position = 'left' | 'right'

class App extends Component<Props, State> {

  state: State = {
    left: ['Banana', 'Apple', 'Orange', 'Strawberry', 'Papaya'],
    right: ['Apple', 'Orange', 'Melon', 'Strwaberry', 'Papaya'],
  };

  private handleAdd = (position: Position) => () =>
    this.changeList(position)(prev => ([...prev, '']));

  private handleChange = (position: Position) => ({ name, index }: { name: string, index: number }) =>
    this.changeList(position)(prev => prev.map((v, i) => i === index ? name : v));

  private handleRemoveName = (position: Position) => (index: number) =>
    this.changeList(position)(prev => prev.filter((_, i) => i !== index));

  private changeList = (position: 'left' | 'right') => (f: (prev: string[]) => string[]): void => {
    switch (position) {
      case 'left': return this.setState(({ left }) => ({ left: f(left) }));
      case 'right': return this.setState(({ right }) => ({ right: f(right) }));
    }
  };

  render() {
    const { classes } = this.props;
    const { left, right } = this.state;
    return (
      <div className="App">
        <AppBar position="static" color="primary">
          <Toolbar>
            <Typography variant="h6" color="inherit">
              array-diff-items demo
            </Typography>
          </Toolbar>
        </AppBar>
        <main className={classes.main}>
          <Grid container spacing={24} justify="center">
            <Grid item xs={3}>
              <Paper className={classes.paper}>
                <Typography variant="h6">List1</Typography>
                <Form
                  names={left}
                  onAdd={this.handleAdd('left')}
                  onChange={this.handleChange('left')}
                  onRemove={this.handleRemoveName('left')}
                />
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper className={classes.paper}>
                <Typography variant="h6">List2</Typography>
                <Form
                  names={right}
                  onAdd={this.handleAdd('right')}
                  onChange={this.handleChange('right')}
                  onRemove={this.handleRemoveName('right')}
                />
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper className={classes.paper}>
                <Typography variant="h6">Diff</Typography>
                <Diff left={left} right={right}/>
              </Paper>
            </Grid>
          </Grid>
        </main>
      </div>
    );
  }
}

export default withStyles(styles)(App);
