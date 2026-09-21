const goalForm = document.getElementById('goal-form');
const goalNameInput = document.getElementById('goal-name');
const goalTargetInput = document.getElementById('goal-target');
const goalError = document.getElementById('goal-error');
const goalsList = document.getElementById('goals-list');
const goalTemplate = document.getElementById('goal-template');

const dollars = (cents) => (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
const toCents = (dollarValue) => Math.round(Number(dollarValue) * 100);

async function api(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function loadGoals() {
  const goals = await api('/api/goals');
  goalsList.innerHTML = '';
  if (goals.length === 0) {
    goalsList.innerHTML = '<p class="empty-state">No goals yet. Add one above to start saving!</p>';
    return;
  }
  for (const goal of goals) {
    goalsList.appendChild(renderGoalCard(goal));
  }
}

function renderGoalCard(goal) {
  const node = goalTemplate.content.cloneNode(true);
  const card = node.querySelector('.goal-card');
  card.dataset.goalId = goal.id;

  node.querySelector('.goal-name').textContent = goal.name;

  const pct = Math.min(100, Math.round((goal.saved_cents / goal.target_cents) * 100));
  node.querySelector('.progress-fill').style.width = `${Math.max(0, pct)}%`;
  node.querySelector('.goal-amounts').textContent =
    `${dollars(goal.saved_cents)} of ${dollars(goal.target_cents)} (${pct}%)`;

  node.querySelector('.delete-goal').addEventListener('click', async () => {
    if (!confirm(`Delete "${goal.name}"? This removes all its transactions.`)) return;
    await api(`/api/goals/${goal.id}`, { method: 'DELETE' });
    loadGoals();
  });

  const txnForm = node.querySelector('.txn-form');
  const amountInput = node.querySelector('.txn-amount');
  const noteInput = node.querySelector('.txn-note');

  const submitTxn = async (sign) => {
    const raw = amountInput.value;
    if (!raw || Number(raw) <= 0) return;
    const amount_cents = sign * toCents(raw);
    await api(`/api/goals/${goal.id}/transactions`, {
      method: 'POST',
      body: JSON.stringify({ amount_cents, note: noteInput.value.trim() || undefined }),
    });
    amountInput.value = '';
    noteInput.value = '';
    loadGoals();
  };

  txnForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitTxn(1);
  });
  node.querySelector('.txn-withdraw').addEventListener('click', () => submitTxn(-1));

  const details = node.querySelector('.txn-history');
  details.addEventListener('toggle', async () => {
    if (!details.open) return;
    const txnList = node.querySelector('.txn-list');
    const txns = await api(`/api/goals/${goal.id}/transactions`);
    txnList.innerHTML = txns.length
      ? ''
      : '<li>No transactions yet.</li>';
    for (const t of txns) {
      const li = document.createElement('li');
      const amountSpan = document.createElement('span');
      amountSpan.className = t.amount_cents >= 0 ? 'amount-positive' : 'amount-negative';
      amountSpan.textContent = `${t.amount_cents >= 0 ? '+' : ''}${dollars(t.amount_cents)}`;
      const labelSpan = document.createElement('span');
      labelSpan.textContent = t.note || new Date(t.created_at + 'Z').toLocaleDateString();
      li.append(labelSpan, amountSpan);
      txnList.appendChild(li);
    }
  });

  return node;
}

goalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  goalError.textContent = '';
  try {
    await api('/api/goals', {
      method: 'POST',
      body: JSON.stringify({
        name: goalNameInput.value.trim(),
        target_cents: toCents(goalTargetInput.value),
      }),
    });
    goalForm.reset();
    loadGoals();
  } catch (err) {
    goalError.textContent = err.message;
  }
});

loadGoals();
