class MatrixEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.matrix = window.typesMatrix || [];
    this.categories = this.getUniqueCategories();
    this.render();
  }

  getUniqueCategories() {
    const categories = new Set();
    this.matrix[0]?.forEach((category) => {
      if (category) categories.add(category);
    });
    return Array.from(categories);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .matrix-editor {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #2980b9;
        }
        .add-btn {
          background: #2980b9;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .add-btn:hover {
          background: #2471a3;
        }
        .categories {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        }
        .category {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px;
        }
        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .category-name {
          font-weight: 500;
          color: #1e293b;
        }
        .delete-btn {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .delete-btn:hover {
          background: #fee2e2;
        }
        .rows {
          display: grid;
          gap: 8px;
        }
        .row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .row-number {
          font-size: 12px;
          color: #64748b;
          width: 24px;
        }
        .row input[type="checkbox"] {
          width: 16px;
          height: 16px;
        }
      </style>
      <div class="matrix-editor">
        <div class="header">
          <h2 class="title">Matrix Categories Editor</h2>
          <button class="add-btn">Add Category</button>
        </div>
        <div class="categories">
          ${this.categories
            .map(
              (category, categoryIndex) => `
            <div class="category">
              <div class="category-header">
                <span class="category-name">${category}</span>
                <button class="delete-btn" data-category="${category}">×</button>
              </div>
              <div class="rows">
                ${this.matrix
                  .map(
                    (row, rowIndex) => `
                  <div class="row">
                    <span class="row-number">${rowIndex}</span>
                    <input type="checkbox" 
                      ${row[this.matrix[0].indexOf(category)] ? "checked" : ""}
                      data-row="${rowIndex}"
                      data-category="${category}"
                    >
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Add category button
    this.shadowRoot
      .querySelector(".add-btn")
      .addEventListener("click", () => this.addCategory());

    // Delete buttons
    this.shadowRoot.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        const category = e.target.dataset.category;
        this.deleteCategory(category);
      });
    });

    // Checkboxes
    this.shadowRoot
      .querySelectorAll('input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.addEventListener("change", (e) => {
          const row = parseInt(e.target.dataset.row);
          const category = e.target.dataset.category;
          const categoryIndex = this.matrix[0].indexOf(category);
          this.matrix[row][categoryIndex] = e.target.checked ? category : "";
          this.updateMatrix();
        });
      });
  }

  addCategory() {
    const name = prompt("Enter new category name:");
    if (!name) return;

    const categoryIndex = this.matrix[0].length;
    this.matrix.forEach((row) => row.push(""));
    this.matrix[0][categoryIndex] = name;
    this.categories = this.getUniqueCategories();
    this.updateMatrix();
    this.render();
  }

  deleteCategory(category) {
    const categoryIndex = this.matrix[0].indexOf(category);
    if (categoryIndex === -1) return;

    this.matrix.forEach((row) => {
      row.splice(categoryIndex, 1);
    });
    this.categories = this.getUniqueCategories();
    this.updateMatrix();
    this.render();
  }

  updateMatrix() {
    window.typesMatrix = this.matrix;
    this.dispatchEvent(
      new CustomEvent("matrix-updated", {
        detail: { matrix: this.matrix },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("matrix-editor", MatrixEditor);
