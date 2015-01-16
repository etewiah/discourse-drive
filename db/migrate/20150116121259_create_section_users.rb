class CreateSectionUsers < ActiveRecord::Migration
  def change
    create_table :section_users do |t|
      t.integer :section_id, null: false
      t.integer :user_id, null: false
      t.string :role
      t.timestamps
    end

    add_index :section_users, [:section_id, :user_id], unique: true
  end
end
